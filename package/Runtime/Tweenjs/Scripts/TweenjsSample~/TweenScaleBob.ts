import { Behaviour } from "@needle-tools/engine";
import { Easing, Tween } from "@tweenjs/tween.js";

export class TweenScaleBob extends Behaviour {

    private tween?: Tween<{ scale: number }>;
    awake(): void {
        this.tween = new Tween<{ scale: number }>({ scale: 0.7 })
            .duration(1)
            .repeat(Infinity)
            .yoyo(true)
            .easing(Easing.Bounce.Out)
            .to({ scale: 1.3 })
            .onUpdate((object) => {
                const s = object.scale;
                this.gameObject.transform.scale.set(s, s, s);
            });

        this.tween.start();
    }

    update(): void {
        // Bug in tween.js
        // https://github.com/tweenjs/tween.js/issues/677
        this.tween?.update();
    }
}
