import { Behaviour, RectTransform, Text, delay, serializable } from "@needle-tools/engine";
import { type Creature } from "./Creature";



export class CreatureUI extends Behaviour {
    @serializable(Behaviour)
    creature: Creature | null = null;

    @serializable(Text)
    health?: Text;

    private rt!: RectTransform;


    async setCreature(creature: Creature) {
        this.rt = this.gameObject.getComponent(RectTransform) as RectTransform;
        this.health = this.gameObject.getComponentInChildren(Text) as Text;
        await delay(300);
        this.rt.gameObject.position.copy(creature.gameObject.position);
        this.rt.markDirty();
        this.creature = creature;
    }

    update(): void {

        if (this.health)
            this.health.text = this.creature?.state?.health.toString() ?? "";

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