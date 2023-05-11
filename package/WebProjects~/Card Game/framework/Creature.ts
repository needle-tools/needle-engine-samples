import { Behaviour, IPointerClickHandler, IPointerEventHandler, ObjectRaycaster, PointerEventData, __internalNotifyObjectDestroyed, getParam, showBalloonMessage } from "@needle-tools/engine";
import { AnimationClip, AnimationMixer, AnimationAction, AnimationActionLoopStyles, LoopOnce, LoopRepeat, Mesh } from "three";
import { CardModel } from "./Card";

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

const $animationKey = Symbol("animationName");

export class CreatureState {

    readonly guid!: string;
    health: number = 100;
    status: string = "";

    constructor(guid: string) {
        this.guid = guid;
    }
}

declare type AnimationEvent = {
    creatureId: string;
    animationId: string;
}

export class Creature extends Behaviour implements IPointerEventHandler {

    onPointerEnter(_: PointerEventData) {
        if (this.isLocallyOwned)
            this.context.input.setCursorPointer();
    }
    onPointerExit(_: PointerEventData) {
        if (this.isLocallyOwned)
            this.context.input.setCursorNormal()
    }
    onPointerClick(_: PointerEventData) {
        if (this.isLocallyOwned) {
            console.log("Creature clicked", this);
            this.testPlayRandomAnimation();
        }
    }


    state: CreatureState | null = null;
    isLocallyOwned: boolean = false;

    private _animations: Map<string | DefaulAnimationTypes, AnimationAction> = new Map();
    private _mixer: AnimationMixer | null = null;
    private _isInIdle: boolean = false;

    initialize(id: string, card: CardModel, gltf: GLTF) {
        const state = new CreatureState(id);
        this.state = state;

        this.gameObject.addNewComponent(ObjectRaycaster);

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

                if (debug)
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

        this.context.connection.beginListen("creature-animation", this.onCreatureAnimation);
    }

    onDestroy(): void {
        this.context.connection.stopListen("creature-animation", this.onCreatureAnimation);
        if (this._mixer) {
            this._mixer.removeEventListener("finished", this.onAnimationFinished);
        }
    }

    private onCreatureAnimation = (data: AnimationEvent) => {
        if (data.creatureId === this.state?.guid) {
            console.log("Creature animation", data)
            this.playAnimation(data.animationId);
        }
    };

    playAnimation(name: string | DefaulAnimationTypes, loop: boolean = false, send: boolean = false) {
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

            if (send) {
                this.context.connection.send("creature-animation", { creatureId: this.state?.guid, animationId: name })
            }
        }
    }

    onBeforeRender(_frame: XRFrame | null): void {
        if (this._mixer) {
            this._mixer.update(this.context.time.deltaTime);
        }

        if (this._isInIdle && randomAnimation) {
            if (Math.random() < .01)
                this.testPlayRandomAnimation();
        }
    }

    private onAnimationFinished = (_) => {
        this.playAnimation(DefaulAnimationTypes.Idle, true)
    };

    private testPlayRandomAnimation() {
        const i = Math.random();
        let sum = 0;
        for (const key of this._animations.keys()) {
            if (sum >= i) {
                showBalloonMessage("PLAY: " + key + " (" + this.context.time.frame + ")");
                this.playAnimation(key, undefined, true);
                break;
            }

            sum += 1 / this._animations.size;
        }
    }
}


