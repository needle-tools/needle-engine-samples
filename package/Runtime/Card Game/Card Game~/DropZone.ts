import { Behaviour, GameObject, IGameObject, IPointerEnterHandler, IPointerEventHandler, Image, PointerEventData, isDestroyed, serializable } from "@needle-tools/engine";
import { DragHandler } from "./DragHandler";
import { Card } from "./Card";

export class DropZone extends Behaviour implements IPointerEventHandler {

    private _lastInstance: GameObject | null = null;

    @serializable(Image)
    image!: Image;

    awake(): void {
        this.image.color.alpha = 0;
        this.image.raycastTarget = false;
    }

    onEnable(): void {
        DragHandler.instance.onStartDragging.addEventListener(this.onDragStart);
    }

    onDragStart = () => {
        this.image.raycastTarget = true;
    }

    onPointerEnter(_args: PointerEventData) {
    }

    onPointerMove(_args: PointerEventData) {
        const isDragging = DragHandler.data !== null;
        this.image.color.alpha = isDragging ? .2 : 0;
    }

    onPointerUp(_args: PointerEventData) {
        console.log(DragHandler.data)
        this.image.raycastTarget = false;
        const card = DragHandler.data;
        if (card instanceof Card) this.onDrop(card);
    }

    onPointerExit(_args: PointerEventData) {
        this.image.color.alpha = 0;
    }

    private async onDrop(card: Card) {
        this._lastInstance?.destroy();
        GameObject.destroy(card.gameObject);

        if (card?.model) {
            const model = card.model;
            this._lastInstance = await model.model.instantiate() as GameObject;
            this._lastInstance.lookAt(this.context.mainCameraComponent!.worldPosition)
        }
    }

}