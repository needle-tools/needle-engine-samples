import { AudioSource, Behaviour, DragTarget, Mathf, serializable } from "@needle-tools/engine";
import { Object3D, Quaternion } from "three";

// Documentation → https://docs.needle.tools/scripting

const _quat = new Quaternion();

/**
 * Turns a record player on and off from what the user does with it: the platter spins as soon as
 * the tonearm leaves its rest, and the music plays while a record lies on the platter and the
 * tonearm sits on it.
 *
 * The record arrives through a DragTarget on the platter, the tonearm is a HingeRotate
 * DragControls - this script only reads both. Put the platter's slot under the platter, so a record
 * dropped there turns with it.
 */
export class RecordPlayer extends Behaviour {

    /** The DragTarget the record is dropped onto. */
    @serializable(DragTarget)
    platter?: DragTarget;

    /** The object that spins. Defaults to the platter. */
    @serializable(Object3D)
    spinner?: Object3D;

    /** The tonearm, turning about its local Y axis from where it rests at start. Its hinge range sets which way it can go. */
    @serializable(Object3D)
    tonearm?: Object3D;

    /** The tonearm is on the record between this angle and maxPlayAngle, in degrees from its rest. */
    @serializable()
    minPlayAngle: number = 14;

    /** See minPlayAngle. */
    @serializable()
    maxPlayAngle: number = 40;

    /** The music. */
    @serializable(AudioSource)
    audioSource?: AudioSource;

    /** Platter speed in turns per minute. */
    @serializable()
    rpm: number = 33.3;

    /** Seconds the platter takes to come up to speed, and to stop. */
    @serializable()
    spinUpTime: number = 0.8;

    private restRotation = new Quaternion();
    private speed = 0;

    start(): void {
        if (this.tonearm) this.restRotation.copy(this.tonearm.quaternion);
    }

    onDisable(): void {
        this.audioSource?.pause();
        this.speed = 0;
    }

    /** How far the tonearm has turned away from its rest, in degrees. */
    get tonearmAngle(): number {
        if (!this.tonearm) return 0;
        _quat.copy(this.restRotation).invert().multiply(this.tonearm.quaternion);
        return Math.abs(Mathf.toDegrees(2 * Math.atan2(_quat.y, _quat.w)));
    }

    /** Whether a record lies on the platter. */
    get hasRecord(): boolean {
        return !!this.platter && this.platter.occupants.length > 0;
    }

    update(): void {
        const angle = this.tonearmAngle;
        const running = angle > 4;
        const playing = running && this.hasRecord && angle >= this.minPlayAngle && angle <= this.maxPlayAngle;

        const dt = this.context.time.deltaTime;
        const step = this.spinUpTime > 0 ? dt / this.spinUpTime : 1;
        this.speed = Mathf.clamp(this.speed + (running ? step : -step), 0, 1);
        const spinner = this.spinner ?? this.platter?.gameObject;
        // clockwise seen from above, like a real turntable
        if (spinner && this.speed > 0) spinner.rotateY(-this.speed * this.rpm / 60 * Math.PI * 2 * dt);

        const audio = this.audioSource;
        if (!audio) return;
        if (playing && !audio.isPlaying) audio.play();
        else if (!playing && audio.isPlaying) audio.pause();
    }
}
