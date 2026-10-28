import { Behaviour, DragAxis, DragControls, serializable, setWorldPosition, setWorldQuaternion } from "@needle-tools/engine";
import { Object3D, Quaternion, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

const _axes = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
const _tipPosition = new Vector3();
const _tipRotation = new Quaternion();
const _goalPosition = new Vector3();
const _goalRotation = new Quaternion();
const _error = new Quaternion();
const _pivot = new Vector3();
const _arm = new Vector3();
const _axis = new Vector3();
const _parentRotation = new Quaternion();
const _turn = new Quaternion();

type Joint = {
    drag: DragControls;
    object: Object3D;
    /** Turning axis in the parent's space, the same one the DragControls hinge uses. */
    axis: Vector3;
    rest: Quaternion;
    /** Degrees from rest. */
    angle: number;
    min: number;
    max: number;
};

/**
 * Inverse kinematics for a chain of HingeRotate joints, such as a robot arm.
 *
 * Every joint keeps its own DragControls and can still be turned by hand. Drag the target handle and
 * the joints turn together to bring the tip to it, each within the angle range of its DragControls,
 * and no faster than maxJointSpeed. Let go and the arm finishes the move, then the handle returns
 * to the tip. While nothing is held, and while a single joint is being turned, the handle rides
 * along on the tip.
 *
 * Joints turn about their own origin, so put each origin on its axis. Solved with damped least
 * squares, which stays steady when the target is out of reach.
 */
export class RobotArmIK extends Behaviour {

    /** The joints from the base outwards, each a HingeRotate DragControls. */
    @serializable(DragControls)
    joints: DragControls[] = [];

    /** The point that reaches for the target, usually the tool tip. Put it under the last joint. */
    @serializable(Object3D)
    tip?: Object3D;

    /** The handle that is dragged to move the tip. Keep it outside the arm, and set its rotation to Free to aim the tool in XR. */
    @serializable(DragControls)
    target?: DragControls;

    /** 0 only brings the tip to the target. 1 also turns the tool to match the target's orientation. */
    @serializable()
    orientationWeight: number = 0.5;

    /** Fastest a joint turns while reaching, in degrees per second. */
    @serializable()
    maxJointSpeed: number = 120;

    /** Solver steps per frame. */
    @serializable()
    iterations: number = 8;

    /** Higher is steadier near full reach and around singular poses, lower reaches more precisely. */
    @serializable()
    damping: number = 0.08;

    private chain: Joint[] = [];
    private targetHeld = false;
    private jointsHeld = 0;
    private reaching = false;
    /** Closest the tip has come since the handle was let go, and for how long it has not come closer. */
    private bestGap = Infinity;
    private stalled = 0;

    /** Whether the arm is moving towards the target. */
    get isReaching(): boolean { return this.reaching; }

    start(): void {
        this.chain = [];
        for (const drag of this.joints) {
            if (!drag) continue;
            const object = drag.gameObject;
            const lo = drag.startAngle, hi = drag.startAngle + drag.rangeAngle;
            const free = Math.abs(drag.rangeAngle) >= 360;
            this.chain.push({
                drag, object,
                axis: _axes[drag.axis ?? DragAxis.X].clone(),
                // read here, before anything moves, so the DragControls and this agree on rest
                rest: drag.getRestPose(object)?.quaternion.clone() ?? object.quaternion.clone(),
                angle: 0,
                min: free ? -Infinity : Math.min(lo, hi),
                max: free ? Infinity : Math.max(lo, hi),
            });
            drag.dragStarted.addEventListener(this.onJointDragStarted);
            drag.dragEnded.addEventListener(this.onJointDragEnded);
        }
        this.target?.dragStarted.addEventListener(this.onTargetDragStarted);
        this.target?.dragEnded.addEventListener(this.onTargetDragEnded);
    }

    onDestroy(): void {
        for (const joint of this.chain) {
            joint.drag.dragStarted.removeEventListener(this.onJointDragStarted);
            joint.drag.dragEnded.removeEventListener(this.onJointDragEnded);
        }
        this.target?.dragStarted.removeEventListener(this.onTargetDragStarted);
        this.target?.dragEnded.removeEventListener(this.onTargetDragEnded);
    }

    private onJointDragStarted = () => { this.jointsHeld++; this.reaching = false; };
    private onJointDragEnded = () => { this.jointsHeld = Math.max(0, this.jointsHeld - 1); };
    private onTargetDragStarted = () => { this.targetHeld = true; this.reaching = true; };
    private onTargetDragEnded = () => { this.targetHeld = false; this.bestGap = Infinity; this.stalled = 0; };

    update(): void {
        if (!this.tip || this.chain.length === 0) return;
        const handle = this.target?.gameObject;

        if (!this.reaching || this.jointsHeld > 0 || !handle) {
            if (handle && !this.targetHeld) {
                this.tip.getWorldPosition(_tipPosition);
                this.tip.getWorldQuaternion(_tipRotation);
                setWorldPosition(handle, _tipPosition);
                setWorldQuaternion(handle, _tipRotation);
            }
            return;
        }

        handle.getWorldPosition(_goalPosition);
        handle.getWorldQuaternion(_goalRotation);
        const dt = Math.min(this.context.time.deltaTime, 0.1);
        const moved = this.solve(_goalPosition, _goalRotation, dt);
        if (this.targetHeld) return;
        // released: done once the arm stops, or stops getting closer - out of reach it can creep for a long time
        const gap = this.tip.getWorldPosition(_tipPosition).distanceTo(_goalPosition);
        if (gap < this.bestGap - 0.001) { this.bestGap = gap; this.stalled = 0; }
        else this.stalled += dt;
        if (moved < 0.01 || this.stalled > 0.3) this.reaching = false;
    }

    /** Turns the joints towards the goal pose, in world space. Returns the most any joint turned, in degrees. */
    solve(goalPosition: Vector3, goalRotation: Quaternion, deltaTime: number): number {
        const tip = this.tip;
        const n = this.chain.length;
        if (!tip || n === 0) return 0;

        for (const joint of this.chain) joint.angle = this.readAngle(joint);
        const start = this.chain.map(j => j.angle);
        const maxStep = this.maxJointSpeed * deltaTime;
        const w = this.orientationWeight;
        const lambda2 = this.damping * this.damping;
        const jacobian = new Float64Array(6 * n);
        const error = new Float64Array(6);
        const system = new Float64Array(36);

        this.chain[0].object.updateWorldMatrix(true, true);
        for (let iteration = 0; iteration < this.iterations; iteration++) {
            tip.getWorldPosition(_tipPosition);
            tip.getWorldQuaternion(_tipRotation);

            // position error, capped so one step never asks for a long jump
            _arm.subVectors(goalPosition, _tipPosition);
            if (_arm.length() > 0.2) _arm.setLength(0.2);
            error[0] = _arm.x; error[1] = _arm.y; error[2] = _arm.z;
            // orientation error as a rotation vector
            _error.copy(goalRotation).multiply(_tipRotation.invert());
            if (_error.w < 0) _error.set(-_error.x, -_error.y, -_error.z, -_error.w);
            const half = Math.acos(Math.min(1, _error.w));
            const scale = half > 1e-6 ? 2 * half / Math.sin(half) * w : 2 * w;
            error[3] = _error.x * scale; error[4] = _error.y * scale; error[5] = _error.z * scale;

            for (let i = 0; i < n; i++) {
                const object = this.chain[i].object;
                this.worldAxis(this.chain[i], _axis);
                object.getWorldPosition(_pivot);
                _arm.subVectors(_tipPosition, _pivot);
                _arm.crossVectors(_axis, _arm);
                jacobian[i * 6 + 0] = _arm.x; jacobian[i * 6 + 1] = _arm.y; jacobian[i * 6 + 2] = _arm.z;
                jacobian[i * 6 + 3] = _axis.x * w; jacobian[i * 6 + 4] = _axis.y * w; jacobian[i * 6 + 5] = _axis.z * w;
            }

            // damped least squares: dTheta = J^T (J J^T + lambda^2 I)^-1 e
            for (let r = 0; r < 6; r++) {
                for (let c = 0; c < 6; c++) {
                    let sum = r === c ? lambda2 : 0;
                    for (let i = 0; i < n; i++) sum += jacobian[i * 6 + r] * jacobian[i * 6 + c];
                    system[r * 6 + c] = sum;
                }
            }
            if (!solveLinear(system, error)) break;

            for (let i = 0; i < n; i++) {
                const joint = this.chain[i];
                let step = 0;
                for (let r = 0; r < 6; r++) step += jacobian[i * 6 + r] * error[r];
                const angle = joint.angle + step * 180 / Math.PI;
                joint.angle = Math.min(joint.max, Math.max(joint.min, Math.min(start[i] + maxStep, Math.max(start[i] - maxStep, angle))));
                this.applyAngle(joint);
            }
            this.chain[0].object.updateWorldMatrix(false, true);
        }

        let moved = 0;
        for (let i = 0; i < n; i++) moved = Math.max(moved, Math.abs(this.chain[i].angle - start[i]));
        return moved;
    }

    /** The joint's angle from rest about its axis, in degrees, unwrapped onto the turn it was last on. */
    private readAngle(joint: Joint): number {
        _turn.copy(joint.rest).invert().premultiply(joint.object.quaternion);
        const twist = _turn.x * joint.axis.x + _turn.y * joint.axis.y + _turn.z * joint.axis.z;
        const angle = 2 * Math.atan2(twist, _turn.w) * 180 / Math.PI;
        return angle + 360 * Math.round((joint.angle - angle) / 360);
    }

    private applyAngle(joint: Joint) {
        _turn.setFromAxisAngle(joint.axis, joint.angle * Math.PI / 180);
        joint.object.quaternion.copy(joint.rest).premultiply(_turn);
    }

    private worldAxis(joint: Joint, out: Vector3) {
        const parent = joint.object.parent;
        if (parent) parent.getWorldQuaternion(_parentRotation);
        else _parentRotation.identity();
        return out.copy(joint.axis).applyQuaternion(_parentRotation);
    }
}

/** Solves the 6x6 system a x = b in place, leaving x in b. Gaussian elimination with partial pivoting. */
function solveLinear(a: Float64Array, b: Float64Array): boolean {
    const n = 6;
    for (let col = 0; col < n; col++) {
        let pivot = col;
        for (let r = col + 1; r < n; r++) if (Math.abs(a[r * n + col]) > Math.abs(a[pivot * n + col])) pivot = r;
        if (Math.abs(a[pivot * n + col]) < 1e-12) return false;
        if (pivot !== col) {
            for (let c = 0; c < n; c++) { const t = a[col * n + c]; a[col * n + c] = a[pivot * n + c]; a[pivot * n + c] = t; }
            const t = b[col]; b[col] = b[pivot]; b[pivot] = t;
        }
        for (let r = col + 1; r < n; r++) {
            const f = a[r * n + col] / a[col * n + col];
            if (f === 0) continue;
            for (let c = col; c < n; c++) a[r * n + c] -= f * a[col * n + c];
            b[r] -= f * b[col];
        }
    }
    for (let r = n - 1; r >= 0; r--) {
        let sum = b[r];
        for (let c = r + 1; c < n; c++) sum -= a[r * n + c] * b[c];
        b[r] = sum / a[r * n + r];
    }
    return true;
}
