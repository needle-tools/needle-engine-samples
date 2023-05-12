import { Behaviour, GameObject, RectTransform, Text, delay, serializable } from "@needle-tools/engine";
import { type Creature } from "./Creature";
import { Object3D } from "three";



export class CreatureUI extends Behaviour {
    @serializable(Behaviour)
    creature: Creature | null = null;

    @serializable(Text)
    health?: Text;

    @serializable(Object3D)
    circle!: Object3D;

    private _initialScale: number = 1;

    awake() {
        this.health = this.gameObject.getComponentInChildren(Text) as Text;
        this._initialScale = this.circle.scale.x;
    }

    async setCreature(creature: Creature) {
        // await delay(300);
        // this.rt.anchoredPosition.set(0, 0, 0);
        this.gameObject.position.copy(creature.gameObject.position).multiplyScalar(100);
        this.creature = creature;
    }

    update(): void {

        // if (this.health)
        //     this.health.text = this.creature?.state?.health.toString() ?? "";
        const scale = Math.sin(this.context.time.time * 10) * .1 + this._initialScale;
        this.circle.scale.set(scale, scale, scale);

        if (this.creature?.destroyed) {
            this.gameObject.destroy();
        }
    }

    // update(): void {
    //     if (Math.random() < .1) {
    //         this.gameObject.position.x += Math.random() - .5;
    //         this.gameObject.position.y += Math.random() - .5;
    //         this.gameObject.position.z += Math.random() - .5;

    //     }
    // }

}