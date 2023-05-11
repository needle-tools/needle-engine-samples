import { Behaviour, getParam } from "@needle-tools/engine";
import { AnimationClip, AnimationMixer, AnimationAction, AnimationActionLoopStyles, LoopOnce, LoopRepeat, Mesh } from "three";
import { CardModel } from "./Deck";

const randomAnimation = getParam("randomanim");
const debug = getParam("debugcreatures");

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

    private _animations: Map<string | DefaulAnimationTypes, AnimationAction> = new Map();
    private _mixer: AnimationMixer | null = null;
    private _isInIdle: boolean = false;

    initialize(card: CardModel, gltf: GLTF) {
        if (!this._mixer) {
            this._mixer = new AnimationMixer(this.gameObject);
            this._mixer.addEventListener("finished", this.onAnimationFinished);
        }

        this.gameObject.traverse(o => {
            if (o instanceof Mesh) o.castShadow = true;
        })

        console.log("Initialize creature", card, this);

        if (gltf && gltf.animations.length > 0) {
            for (const anim of gltf.animations) {
                const action = this._mixer.clipAction(anim);
                action[$animationKey] = anim.name;
                let key = anim.name;

                console.log(key);
                if (key === card.idleAnimation) {
                    key = DefaulAnimationTypes.Idle;
                }
                // else if (key.endsWith("_Idle"))
                //     key = DefaulAnimationTypes.Idle;

                this._animations.set(key, action);
            }
        }
        else console.warn("No animations found in gltf", gltf);

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
        const action = this._animations.get(name);
        if (action) {
            for (const act of this._animations.values()) {
                if (act === action) continue;
                act.fadeOut(.3);
            }
            if (action.isRunning()) return;
            if (debug)
                console.log("PLAY", name);
            this._isInIdle = loop;
            action.fadeIn(.3);
            if (loop) action.setLoop(LoopRepeat, -1);
            else {
                action.setLoop(LoopOnce, 0);
            }
            action.clampWhenFinished = !loop;
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