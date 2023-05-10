import { BehaviorExtension, Behaviour, GameObject } from "@needle-tools/engine";
import { Card } from "./Card";
import { DragHandler } from "./DragHandler";


export class GameManager extends Behaviour {

    private _lastInstance: GameObject | null = null;

    onEnable(): void {
        DragHandler.instance.onDrop.addEventListener(this.onDrop);
    }

    private onDrop = async (card: Card) => {
        this._lastInstance?.destroy();
        GameObject.destroy(card.gameObject);

        if (card?.model) {
            const model = card.model;
            this._lastInstance = await model.model.instantiate() as GameObject;
            this._lastInstance.lookAt(this.context.mainCameraComponent!.worldPosition)
        }
    }

}