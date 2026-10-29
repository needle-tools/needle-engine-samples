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
const _system = new Float64Array(9);
const _inverse = new Float64Array(9);
const _solved = new Float64Array(3);
const _residual = new Float64Array(3);
/** The tool starts turning towards the target's orientation once the tip is this close, in meters, and stops again beyond turnStopGap. */
const turnStartGap = 0.03, turnStopGap = 0.06;
/** Seconds the tool takes to go from not turning to turning fully. */
const turnRampSeconds = 0.4;
/** How far the handle has to be turned during a drag, in radians, before the tool follows its orientation. */
const handleTurnedAngle = 0.02;
/** Most orientation error, in radians, one solver step tries to remove, and the damping for that part of the step. */
const maxTurnStep = 0.2, turnDamping = 0.3;

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
 * and no faster than maxJointSpeed. Let go and the arm finishes the move, and the handle stays where
 * it was let go, also out of reach. Turning a joint by hand brings the handle back onto the tip.
 *
 * The tool only turns to the handle's orientation once the handle itself has been turned while
 * dragging, as in XR. Dragged with a mouse the handle keeps its rotation, and holding the tool to
 * that over a long move would swing the wrist around.
 *
 * Joints turn about their own origin, so put each origin on its axis. Solved with damped least
 * squares, reaching the position first and turning the tool with whatever freedom is left. A step
 * is only kept if it brings the tip closer, so out of reach the arm stretches towards the target
 * and holds still.
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

    /** How far the tool turns towards the target's orientation each step, once the target has been turned, using only what reaching the position leaves free. 0 ignores the orientation. */
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
    /** Whether the handle rides along on the tip: until it is first dragged, and again once a joint is turned by hand. */
    private following = true;
    /** Closest the tip has come since the handle was let go, and for how long it has not come closer. */
    private bestGap = Infinity;
    private stalled = 0;
    /** How much of orientationWeight is used, from 0 to 1. */
    private turnBlend = 1;
    /** The handle's rotation when the drag started, and whether it has been turned away from it since. */
    private readonly dragStartRotation = new Quaternion();
    private handleTurned = false;

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

    private onJointDragStarted = () => { this.jointsHeld++; this.reaching = false; this.following = true; };
    private onJointDragEnded = () => { this.jointsHeld = Math.max(0, this.jointsHeld - 1); };
    private onTargetDragStarted = () => {
        this.targetHeld = true;
        this.reaching = true;
        this.following = false;
        this.turnBlend = 0;
        this.handleTurned = false;
        this.target?.gameObject.getWorldQuaternion(this.dragStartRotation);
    };
    private onTargetDragEnded = () => { this.targetHeld = false; this.bestGap = Infinity; this.stalled = 0; };

    update(): void {
        if (!this.tip || this.chain.length === 0) return;
        const handle = this.target?.gameObject;

        if (!this.reaching || this.jointsHeld > 0 || !handle) {
            if (handle && this.following && !this.targetHeld) {
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
        // the tool starts turning once the tip is close, and gradually: on a long move, turning and
        // reaching steps alternate and pull the wrist back and forth
        const distance = this.tip.getWorldPosition(_tipPosition).distanceTo(_goalPosition);
        if (this.targetHeld && _goalRotation.angleTo(this.dragStartRotation) > handleTurnedAngle) this.handleTurned = true;
        if (!this.handleTurned || distance > turnStopGap) this.turnBlend = 0;
        else if (distance < turnStartGap || this.turnBlend > 0) this.turnBlend = Math.min(1, this.turnBlend + dt / turnRampSeconds);
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
        const before = new Float64Array(n);
        const step = new Float64Array(n);
        const locked = new Uint8Array(n);
        const maxStep = this.maxJointSpeed * deltaTime;
        const jacobian = new Float64Array(6 * n);
        const error = new Float64Array(6);
        const scratch: StepScratch = { x: new Float64Array(3 * n), free: new Float64Array(n * n), turn: new Float64Array(3 * n) };

        this.chain[0].object.updateWorldMatrix(true, true);
        let cost = this.measure(goalPosition, goalRotation, error);
        for (let iteration = 0; iteration < this.iterations; iteration++) {
            tip.getWorldPosition(_tipPosition);
            for (let i = 0; i < n; i++) {
                const object = this.chain[i].object;
                this.worldAxis(this.chain[i], _axis);
                object.getWorldPosition(_pivot);
                _arm.subVectors(_tipPosition, _pivot);
                _arm.crossVectors(_axis, _arm);
                jacobian[i * 6 + 0] = _arm.x; jacobian[i * 6 + 1] = _arm.y; jacobian[i * 6 + 2] = _arm.z;
                jacobian[i * 6 + 3] = _axis.x; jacobian[i * 6 + 4] = _axis.y; jacobian[i * 6 + 5] = _axis.z;
            }

            // with the tool turning too, and if that gets no closer, for the position alone
            let improved = false;
            for (const withTurn of this.orientationWeight > 0 ? [true, false] : [false]) {
                // solved again without the joints that sit on a limit and push against it, so the others take over their share
                locked.fill(0);
                let solved = false;
                for (let pass = 0; pass <= n; pass++) {
                    if (!this.prioritizedStep(jacobian, locked, error, scratch, step, withTurn)) break;
                    let newlyLocked = false;
                    for (let i = 0; i < n; i++) {
                        const joint = this.chain[i];
                        if (locked[i]) continue;
                        if ((step[i] > 0 && joint.angle >= joint.max) || (step[i] < 0 && joint.angle <= joint.min)) {
                            locked[i] = 1;
                            newlyLocked = true;
                        }
                    }
                    if (!newlyLocked) { solved = true; break; }
                }
                if (!solved) continue;

                // shrink the whole step to what is left of this frame's turn budget, keeping its direction
                let scale = 1;
                for (let i = 0; i < n; i++) {
                    if (step[i] === 0) continue;
                    const room = step[i] > 0 ? start[i] + maxStep - this.chain[i].angle : this.chain[i].angle - (start[i] - maxStep);
                    scale = Math.min(scale, Math.max(0, room) / Math.abs(step[i]));
                }
                if (scale < 1e-4) break;

                // keep the step only if the tip gets closer, halving it until it does. Out of reach the
                // linear guess overshoots, and taking it anyway makes the arm shake around the closest pose.
                for (let i = 0; i < n; i++) before[i] = this.chain[i].angle;
                for (let attempt = 0; attempt < 6 && !improved; attempt++, scale *= 0.5) {
                    for (let i = 0; i < n; i++) {
                        const joint = this.chain[i];
                        joint.angle = Math.min(joint.max, Math.max(joint.min, before[i] + step[i] * scale));
                        this.applyAngle(joint);
                    }
                    this.chain[0].object.updateWorldMatrix(false, true);
                    const next = this.measure(goalPosition, goalRotation, error);
                    if (next < cost - 1e-12) { cost = next; improved = true; }
                }
                if (improved) break;
                for (let i = 0; i < n; i++) { this.chain[i].angle = before[i]; this.applyAngle(this.chain[i]); }
                this.chain[0].object.updateWorldMatrix(false, true);
                this.measure(goalPosition, goalRotation, error);
            }
            if (!improved) break;
        }

        let moved = 0;
        for (let i = 0; i < n; i++) moved = Math.max(moved, Math.abs(this.chain[i].angle - start[i]));
        return moved;
    }

    /**
     * Writes the error from tip to goal into error: position capped so one step never asks for a long
     * jump, then orientation as a rotation vector. Returns how far off the tip is, for comparing steps:
     * the squared distance, plus the orientation weighted so little that it only decides between
     * steps that reach about equally well.
     */
    private measure(goalPosition: Vector3, goalRotation: Quaternion, error: Float64Array): number {
        this.tip!.getWorldPosition(_tipPosition);
        this.tip!.getWorldQuaternion(_tipRotation);
        _arm.subVectors(goalPosition, _tipPosition);
        const distance2 = _arm.lengthSq();
        if (distance2 > 0.04) _arm.setLength(0.2);
        error[0] = _arm.x; error[1] = _arm.y; error[2] = _arm.z;
        _error.copy(goalRotation).multiply(_tipRotation.invert());
        if (_error.w < 0) _error.set(-_error.x, -_error.y, -_error.z, -_error.w);
        const half = Math.acos(Math.min(1, _error.w));
        const scale = half > 1e-6 ? 2 * half / Math.sin(half) : 2;
        error[3] = _error.x * scale; error[4] = _error.y * scale; error[5] = _error.z * scale;
        // 2 cm per radian
        const turn = 2 * half * this.orientationWeight * this.turnBlend * 0.02;
        return distance2 + turn * turn;
    }

    /**
     * One step into step, in degrees, with the locked joints held still. Damped least squares for the
     * position, dTheta = Jp^T (Jp Jp^T + lambda^2 I)^-1 e. The orientation is then solved the same way,
     * but only through N = I - Jp^T (Jp Jp^T)^-1 Jp, the joint motion the position does not use.
     */
    private prioritizedStep(jacobian: Float64Array, locked: Uint8Array, error: Float64Array, scratch: StepScratch, step: Float64Array, withTurn: boolean): boolean {
        const n = this.chain.length;
        const lambda2 = this.damping * this.damping;
        const { x, free, turn } = scratch;

        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
            let sum = r === c ? lambda2 : 0;
            for (let i = 0; i < n; i++) if (!locked[i]) sum += jacobian[i * 6 + r] * jacobian[i * 6 + c];
            _system[r * 3 + c] = sum;
        }
        if (!invert3(_system, _inverse)) return false;
        multiply3(_inverse, error, 0, _solved);
        for (let i = 0; i < n; i++)
            step[i] = locked[i] ? 0 : jacobian[i * 6] * _solved[0] + jacobian[i * 6 + 1] * _solved[1] + jacobian[i * 6 + 2] * _solved[2];

        const w = this.orientationWeight * this.turnBlend;
        if (withTurn && w > 0) {
            // what is left of the orientation error after the position step
            for (let r = 0; r < 3; r++) {
                let sum = error[3 + r] * w;
                for (let i = 0; i < n; i++) sum -= jacobian[i * 6 + 3 + r] * step[i];
                _residual[r] = sum;
            }
            // capped like the position, so one step never asks for a big turn
            const residual = Math.hypot(_residual[0], _residual[1], _residual[2]);
            if (residual > maxTurnStep) for (let r = 0; r < 3; r++) _residual[r] *= maxTurnStep / residual;
            // N, then the orientation Jacobian seen through it. N with barely any damping: damped, turning
            // the tool would also move the tip a little, and that step would be thrown away for it
            for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
                let sum = r === c ? 1e-5 : 0;
                for (let i = 0; i < n; i++) if (!locked[i]) sum += jacobian[i * 6 + r] * jacobian[i * 6 + c];
                _system[r * 3 + c] = sum;
            }
            invert3(_system, _inverse);
            for (let j = 0; j < n; j++) multiply3(_inverse, jacobian, j * 6, x, j * 3);
            for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
                free[i * n + j] = locked[i] || locked[j] ? 0
                    : (i === j ? 1 : 0) - (jacobian[i * 6] * x[j * 3] + jacobian[i * 6 + 1] * x[j * 3 + 1] + jacobian[i * 6 + 2] * x[j * 3 + 2]);
            }
            for (let j = 0; j < n; j++) for (let r = 0; r < 3; r++) {
                let sum = 0;
                for (let i = 0; i < n; i++) sum += jacobian[i * 6 + 3 + r] * free[i * n + j];
                turn[j * 3 + r] = sum;
            }
            // damped more than the position: what the position leaves free is often only a little
            // turning about some axes, and solving for those exactly swings the wrist back and forth
            for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
                let sum = r === c ? turnDamping * turnDamping : 0;
                for (let j = 0; j < n; j++) sum += turn[j * 3 + r] * turn[j * 3 + c];
                _system[r * 3 + c] = sum;
            }
            if (invert3(_system, _inverse)) {
                multiply3(_inverse, _residual, 0, _solved);
                for (let j = 0; j < n; j++) step[j] += turn[j * 3] * _solved[0] + turn[j * 3 + 1] * _solved[1] + turn[j * 3 + 2] * _solved[2];
            }
        }
        for (let i = 0; i < n; i++) step[i] *= 180 / Math.PI;
        return true;
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

type StepScratch = { x: Float64Array, free: Float64Array, turn: Float64Array };

/** Inverts the 3x3 matrix a into out. False if it is singular. */
function invert3(a: Float64Array, out: Float64Array): boolean {
    const c00 = a[4] * a[8] - a[5] * a[7], c01 = a[5] * a[6] - a[3] * a[8], c02 = a[3] * a[7] - a[4] * a[6];
    const det = a[0] * c00 + a[1] * c01 + a[2] * c02;
    if (Math.abs(det) < 1e-18) return false;
    const f = 1 / det;
    out[0] = c00 * f; out[1] = (a[2] * a[7] - a[1] * a[8]) * f; out[2] = (a[1] * a[5] - a[2] * a[4]) * f;
    out[3] = c01 * f; out[4] = (a[0] * a[8] - a[2] * a[6]) * f; out[5] = (a[2] * a[3] - a[0] * a[5]) * f;
    out[6] = c02 * f; out[7] = (a[1] * a[6] - a[0] * a[7]) * f; out[8] = (a[0] * a[4] - a[1] * a[3]) * f;
    return true;
}

/** out = m v, for the 3x3 matrix m and the 3 values of v starting at offset. */
function multiply3(m: Float64Array, v: Float64Array, offset: number, out: Float64Array, outOffset = 0) {
    for (let r = 0; r < 3; r++) out[outOffset + r] = m[r * 3] * v[offset] + m[r * 3 + 1] * v[offset + 1] + m[r * 3 + 2] * v[offset + 2];
}
