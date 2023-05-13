import { Behaviour, IPointerEventHandler, ObjectRaycaster, PointerEventData, __internalNotifyObjectDestroyed, getParam, showBalloonMessage } from "@needle-tools/engine";
import { AnimationClip, AnimationMixer, AnimationAction, LoopOnce, LoopRepeat, Mesh } from "three";
import { CardModel } from "./CardModel";

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
    private readonly _creature: Creature;
    private _health: number = 100;
    private readonly _statusEffects: string[] = [];

    get statusEffects() {
        return this._statusEffects;
    }

    isDead() {
        return this._health <= 0;
    }

    get health() {
        return this._health;
    }

    set health(value: number) {
        if (value === this._health) return;
        const prev = this._health;
        this._health = value;
        if (this._health <= 0) {
            this._health = 0;
            this._creature.die();
        }
        else {
            if (prev > this._health) {
                this._creature.playAnimation(DefaulAnimationTypes.HitRecieve);
            }
            this._creature.context.connection.send("creature-health-" + this.guid, this._health);
        }
    }

    constructor(guid: string, creature: Creature) {
        this.guid = guid;
        this._creature = creature;
    }

    onEnable() {
        this._creature.context.connection.beginListen("creature-health-" + this.guid, this.onHealthChanged);
    }

    onDisable() {
        this._creature.context.connection.stopListen("creature-health-" + this.guid, this.onHealthChanged);
    }

    private onHealthChanged = (val) => {
        this.health = val;
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


    state!: CreatureState;
    isLocallyOwned: boolean = false;

    private _animations: Map<string | DefaulAnimationTypes, AnimationAction> = new Map();
    private _mixer!: AnimationMixer;
    private _isInIdle: boolean = false;

    initialize(id: string, card: CardModel, gltf: GLTF) {
        const state = new CreatureState(id, this);
        this.state = state;
        this.name = card.name;
        this.guid = id;
        this.state.onEnable();

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

        // just for testing
        this.gameObject.addNewComponent(ObjectRaycaster);
    }
    awake(): void {
        this._mixer = new AnimationMixer(this.gameObject);
    }
    onEnable(): void {
        this.state?.onEnable();
        this.context.connection.beginListen("creature-animation", this.onCreatureAnimation);
        this._mixer.addEventListener("finished", this.onAnimationFinished);
    }
    onDisable(): void {
        this.state.onDisable();
        this.context.connection.stopListen("creature-animation", this.onCreatureAnimation);
        this._mixer.removeEventListener("finished", this.onAnimationFinished);
    }

    private _lastHit: number = 0;
    update(): void {
        if (this.isLocallyOwned && Math.random() > .9 && (this.context.time.time - this._lastHit) > .5) {
            this._lastHit = this.context.time.time;
            this.state.health -= Math.random() * 30;
        }
    }

    onDestroy(): void {
        this.context.connection.stopListen("creature-animation", this.onCreatureAnimation);
        if (this._mixer) {
            this._mixer.removeEventListener("finished", this.onAnimationFinished);
        }
    }

    die() {
        this.state.health = 0;
        this.dispatchEvent(new CustomEvent<Creature>("died", { detail: this }));
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


