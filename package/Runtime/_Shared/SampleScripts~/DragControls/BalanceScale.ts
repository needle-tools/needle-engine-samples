import { Behaviour, DragTarget, GameObject, Mathf, getWorldQuaternion, serializable, setWorldQuaternion } from "@needle-tools/engine";
import { Object3D, Quaternion, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

const _axis = new Vector3(0, 0, 1);
const _tilt = new Quaternion();

/** How heavy an object is on a BalanceScale. */
export class ScaleWeight extends Behaviour {
    /** Weight in grams. */
    @serializable()
    grams: number = 100;
}

/**
 * A two-pan balance: each pan is an Area DragTarget, and the beam tilts towards the heavier one,
 * weighing whatever the pans hold by its ScaleWeight (100 g without one). The beam swings on a
 * spring, so it overshoots a little and settles, and the pans stay level while it turns.
 *
 * Turn on parentOnDrop on both pans and parent them under the beam: what lies in a pan then rides
 * up and down with it.
 */
export class BalanceScale extends Behaviour {

    /** The beam, turning about its local Z axis. */
    @serializable(Object3D)
    beam?: Object3D;

    /** The pan on the left, seen from the front. */
    @serializable(DragTarget)
    leftPan?: DragTarget;

    /** The pan on the right, seen from the front. */
    @serializable(DragTarget)
    rightPan?: DragTarget;

    /** The beam turns at most this far, in degrees. */
    @serializable()
    maxAngle: number = 14;

    /** A difference of this many grams turns the beam most of the way to maxAngle. */
    @serializable()
    sensitivity: number = 250;

    /** How hard the beam is pulled towards its angle. Higher swings faster. */
    @serializable()
    stiffness: number = 40;

    /** How quickly the swing dies down. Lower wobbles longer. */
    @serializable()
    damping: number = 4;

    private restRotation = new Quaternion();
    private panRotations = new Map<Object3D, Quaternion>();
    private angle = 0;
    private velocity = 0;

    start(): void {
        if (this.beam) this.restRotation.copy(this.beam.quaternion);
        for (const pan of [this.leftPan, this.rightPan]) {
            if (pan) this.panRotations.set(pan.gameObject, getWorldQuaternion(pan.gameObject).clone());
        }
    }

    /** Grams lying in the pan. */
    weigh(pan: DragTarget | undefined): number {
        let grams = 0;
        for (const occupant of pan?.occupants ?? []) grams += GameObject.getComponent(occupant, ScaleWeight)?.grams ?? 100;
        return grams;
    }

    /** Whether both pans hold something and weigh the same. */
    get balanced(): boolean {
        const left = this.weigh(this.leftPan), right = this.weigh(this.rightPan);
        return left > 0 && right > 0 && Math.abs(left - right) < 0.5;
    }

    update(): void {
        if (!this.beam) return;
        const difference = this.weigh(this.rightPan) - this.weigh(this.leftPan);
        const target = this.maxAngle * Math.tanh(difference / Math.max(1, this.sensitivity));

        // a damped spring, stepped in small pieces so a long frame doesn't blow it up
        let dt = Math.min(this.context.time.deltaTime, 0.1);
        while (dt > 0) {
            const step = Math.min(dt, 1 / 120);
            this.velocity += (target - this.angle) * this.stiffness * step;
            this.velocity *= Math.exp(-this.damping * step);
            this.angle += this.velocity * step;
            dt -= step;
        }

        // the heavier side goes down: turning about +Z lifts the +X end
        _tilt.setFromAxisAngle(_axis, -Mathf.toRadians(this.angle));
        this.beam.quaternion.copy(this.restRotation).multiply(_tilt);
        this.beam.updateMatrixWorld();
        for (const [pan, rotation] of this.panRotations) setWorldQuaternion(pan, rotation);
    }
}
