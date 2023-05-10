import { Behaviour, getParam } from "@needle-tools/engine";
import { AnimationClip, AnimationMixer, AnimationAction, AnimationActionLoopStyles, LoopOnce, LoopRepeat } from "three";
import { CardModel } from "./Deck";

const randomAnimation = getParam("randomanim");

export declare type GLTF = {
    animations: AnimationClip[];
}

export enum DefaulAnimationTypes {
    Idle = "Idle",
    Dance = "Dance",
    Jump = "Jump",
    HitRecieve = "HitRecieve",
    Walk = "Walk",
    Death = "Death",
    Yes = "Yes",
    No = "No",
    Attack = "Bite_Front",
}

const $animationKey = Symbol("animationName")

export class Creature extends Behaviour {

    health: number = 100;

    private _animations: Map<string, AnimationAction> = new Map();
    private _mixer: AnimationMixer | null = null;
    private _isInIdle: boolean = false;

    initialize(card: CardModel, gltf: GLTF) {
        if (!this._mixer) {
            this._mixer = new AnimationMixer(this.gameObject);
            this._mixer.addEventListener("finished", this.onAnimationFinished);
        }

        if (gltf && gltf.animations.length > 0) {
            for (const anim of gltf.animations) {
                const action = this._mixer.clipAction(anim);
                action[$animationKey] = anim.name;
                this._animations.set(anim.name, action);
            }
        }

        this.playAnimation(DefaulAnimationTypes.Idle, true);
    }

    onDestroy(): void {
        if (this._mixer) {
            this._mixer.removeEventListener("finished", this.onAnimationFinished);
        }
    }

    playAnimation(name: string | DefaulAnimationTypes, loop: boolean = false) {
        if (typeof name !== "string") {
            name = DefaulAnimationTypes[name];
        }
        console.log("PLAY", name);
        const action = this._animations.get(name);
        if (action) {
            for (const act of this._animations.values()) {
                if (act === action) continue;
                act.fadeOut(.3);
            }
            if (action.isRunning()) return;
            this._isInIdle = loop;
            action.fadeIn(.3);
            action.clampWhenFinished = true;
            if (loop) action.setLoop(LoopRepeat, -1);
            else action.setLoop(LoopOnce, 0);
            action.stop();
            action.play();
        }
    }

    onBeforeRender(_frame: XRFrame | null): void {
        if (this._mixer) {
            this._mixer.update(this.context.time.deltaTime);
        }

        if (this._isInIdle && randomAnimation) {
            if (Math.random() < .01) this.playAnimation(DefaulAnimationTypes.Attack, false);
            if (Math.random() > 0.99) this.playAnimation(DefaulAnimationTypes.Dance, false);
        }
    }

    private onAnimationFinished = (_) => {
        this.playAnimation(DefaulAnimationTypes.Idle, true)
    };
}