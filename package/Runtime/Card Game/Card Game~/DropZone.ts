import { Behaviour, IPointerEnterHandler, IPointerEventHandler, Image, PointerEventData, isDestroyed, serializable } from "@needle-tools/engine";
import { DragHandler } from "./DragHandler";

export class DropZone extends Behaviour implements IPointerEventHandler {

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
        this.image.color.alpha = isDragging ? .5 : 0;
    }

    onPointerUp(_args: PointerEventData) {
        console.log(DragHandler.data)
        this.image.raycastTarget = false;
    }

    onPointerExit(_args: PointerEventData) {
        this.image.color.alpha = 0;
    }

}