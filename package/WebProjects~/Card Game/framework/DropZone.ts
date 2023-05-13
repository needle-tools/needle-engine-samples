import { Behaviour, CanvasGroup, GameObject, IGameObject, IPointerEnterHandler, IPointerEventHandler, Image, PointerEventData, isDestroyed, serializable } from "@needle-tools/engine";
import { DragHandler } from "./DragHandler";

export class DropZone extends Behaviour implements IPointerEventHandler {
    @serializable(Image)
    image!: Image;

    private cg!: CanvasGroup;

    awake(): void {
        this.cg = this.gameObject.getOrAddComponent(CanvasGroup);
        this.cg.alpha = 0;
        this.cg.blocksRaycasts = false;
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
        this.cg.blocksRaycasts = true;
        this.cg.alpha = .5;
    }
    onDragEnd = () => {
        this.cg.blocksRaycasts = false;
        this.cg.alpha = 0;
    }

    onPointerMove(_args: PointerEventData) {
        const isDragging = DragHandler.data !== null;
        this.cg.alpha = isDragging ? 1 : 0;
    }

    onPointerUp(_args: PointerEventData) {
        this.cg.blocksRaycasts = false;
        DragHandler.drop();
    }

    onPointerExit(_args: PointerEventData) {
        if (DragHandler.data) this.cg.alpha = .5;
        else this.cg.alpha = 0;
    }

}