import { AnimatorController, BehaviorExtension, Behaviour, GameObject } from "@needle-tools/engine";
import { Card } from "./Card";
import { DragHandler } from "./DragHandler";
import { Creature, GLTF } from "./Creature";

export class GameManager extends Behaviour {

    private _lastInstance: GameObject | null = null;

    onEnable(): void {
        DragHandler.instance.onDrop.addEventListener(this.onDrop);
    }

    private onDrop = (card: Card) => {
        this._lastInstance?.destroy();
        GameObject.destroy(card.gameObject);
        this.createCreature(card);
    }

    private async createCreature(card: Card) {
        if (card?.model) {
            const model = card.model;
            this._lastInstance = await model.model.instantiate() as GameObject;
            this._lastInstance.lookAt(this.context.mainCameraComponent!.worldPosition);

            const creature = this._lastInstance.getOrAddComponent(Creature)
            creature.initialize(model, model.model.rawAsset as GLTF);
        }
    }

}