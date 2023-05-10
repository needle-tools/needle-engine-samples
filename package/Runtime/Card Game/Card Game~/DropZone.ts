import { Behaviour, GameObject, IGameObject, IPointerEnterHandler, IPointerEventHandler, Image, PointerEventData, isDestroyed, serializable } from "@needle-tools/engine";
import { DragHandler } from "./DragHandler";
import { Card } from "./Card";

export class DropZone extends Behaviour implements IPointerEventHandler {


    @serializable(Image)
    image!: Image;

    awake(): void {
        this.image.color.alpha = 0;
        this.image.raycastTarget = false;
    }

    onEnable(): void {
        DragHandler.instance.onStartDragging.addEventListener(this.onDragStart);
        DragHandler.instance.onEndDragging.addEventListener(this.onDragEnd);
    }

    onDisable(): void {
        DragHandler.instance.onStartDragging.removeEventListener(this.onDragStart);
        DragHandler.instance.onEndDragging.removeEventListener(this.onDragEnd);
    }

    onDragStart = () => {
        this.image.raycastTarget = true;
        this.image.color.alpha = .1;
    }
    onDragEnd = () => {
        this.image.raycastTarget = false;
        this.image.color.alpha = 0;
    }

    onPointerMove(_args: PointerEventData) {
        const isDragging = DragHandler.data !== null;
        this.image.color.alpha = isDragging ? .2 : 0;
    }

    onPointerUp(_args: PointerEventData) {
        this.image.raycastTarget = false;
        DragHandler.drop();
    }

    onPointerExit(_args: PointerEventData) {
        if (DragHandler.data) this.image.color.alpha = .1;
        else this.image.color.alpha = 0;
    }

}