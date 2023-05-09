import { Behaviour, Canvas, CanvasGroup, GameObject, IPointerEventHandler, PointerEventData, RectTransform, serializable } from "@needle-tools/engine";
import { Object3D } from "three";
import { DragHandler } from "./DragHandler";

const canvasGroup: CanvasGroup = new CanvasGroup();
canvasGroup.interactable = false;
canvasGroup.blocksRaycasts = false;

export class Card extends Behaviour implements IPointerEventHandler {

    @serializable(RectTransform)
    rendering!: RectTransform;

    private _isDragging: boolean = false;
    private _originalParent: Object3D | undefined;

    get rt() {
        return this.rendering;
    }

    awake(): void {
        if (!(this.rendering instanceof RectTransform) && this.rendering) {
            this.rendering = GameObject.getComponent(this.rendering, RectTransform)!;
        }
    }

    onPointerDown(e: PointerEventData) {
        e.use();
        this._isDragging = true;
        this._originalParent = this.rt?.parent?.gameObject;
        const canvas = this.rt?.canvas;
        if (canvas) {
            this.rt?.markDirty();
            canvas.gameObject.add(this.rt.gameObject);
            this.rt.gameObject.position.set(0, 0, 0);
            GameObject.addComponent(this.rt.gameObject, canvasGroup);
            DragHandler.startDragging(this);
        }


    }

    onPointerUp(e: PointerEventData) {
        e.use();
        this._isDragging = false;
        DragHandler.cancel(this);
        GameObject.removeComponent(canvasGroup)!;
        if (this._originalParent) {
            this.rt?.anchoredPosition.set(0, 0, 0);
            this._originalParent.add(this.rt.gameObject);
        }
    }

    update(): void {
        if (!this.rt) return;
        if (!this._isDragging) return;
        const delta = this.context.input.getPointerPositionDelta(0);
        this.rt.anchoredPosition.x += delta!.x;
        this.rt.anchoredPosition.y -= delta!.y;
    }
}