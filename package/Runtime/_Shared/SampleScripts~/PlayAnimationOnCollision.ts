import { Behaviour, serializeable, Animation } from "@needle-tools/engine";


export class PlayAnimationOnCollision extends Behaviour {


    @serializeable(Animation)
    animation?: Animation;

    private _lastTriggerTime: number = 0;

    onTriggerEnter(_col) {
        if (this.context.time.time - this._lastTriggerTime < .3) return;
        this._lastTriggerTime = this.context.time.time;
        if (this.animation) this.animation.play(0, { loop: false });
    }

    onTriggerExit() {
    }
}