import { Animation, Behaviour, serializeable } from "@needle-tools/engine";

export class PlayAnimationOnTrigger extends Behaviour {
    @serializeable(Animation)
    animation?: Animation;

    onTriggerEnter() {
        if(this.animation?.isPlaying) return;
        this.animation?.play(0, { loop: false })
    }
}