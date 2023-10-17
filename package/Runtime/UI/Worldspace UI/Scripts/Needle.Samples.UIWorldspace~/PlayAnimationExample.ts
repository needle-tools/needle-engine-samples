import { Animation, Behaviour, serializable } from "@needle-tools/engine";

export class PlayAnimationExample extends Behaviour {
    @serializable(Animation)
    animation?: Animation;

    play(index: number) {
        this.animation?.play(index, { loop: false });
    }
}