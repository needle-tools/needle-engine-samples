import { Behaviour,EventList,IPointerDownHandler, IPointerMoveHandler, IPointerUpHandler, Input, Mathf, PointerEventData, Rect, RectTransform, isMobileDevice, serializable } from "@needle-tools/engine";
import { Vector2, Vector3 } from "three";

export class Touchpad extends Behaviour implements IPointerDownHandler, IPointerUpHandler
{
    @serializable(RectTransform)
    touchArea?: RectTransform;

    // @nonSerialized
    @serializable(EventList)
    onMove: EventList = new EventList();

    @serializable(EventList)
    onClick: EventList = new EventList();

    @serializable()
    sensitivity: number = 1;

    @serializable()
    clickDeadzone: number = 15;

    private currentPointer;
    private isDragging;
    private dragStartPos: Vector2 = new Vector2();

    onPointerDown(args: PointerEventData) {
        if (this.isDragging || args.pointerId === undefined)
            return;

        this.isDragging = true;
            
        const input = this.context.input;
        this.dragStartPos.copy(input.getPointerPosition(args.pointerId)!);
        this.currentPointer = args.pointerId;

        args.use();
    }

    onPointerUp(args: PointerEventData) {
        if (!this.isDragging || args.pointerId !== this.currentPointer)
            return;

        console.log("onPointerUp", args.pointerId, this.currentPointer)

        this.isDragging = false;

        const drag = this.getCurrentDrag(this.currentPointer);
        if (drag.length() < this.clickDeadzone) {
            this.onClick.invoke();
        }

        args.use();
    }

    update() {
        if (!this.isDragging)
            return;

        const input = this.context.input;
        const mousePosDelta = input.getPointerPositionDelta(this.currentPointer);

        const drag = this.getCurrentDrag(this.currentPointer);

        if (mousePosDelta && drag.length() > this.clickDeadzone) {
            mousePosDelta.multiplyScalar(this.sensitivity);
            this.onMove.invoke(mousePosDelta);
        }
    }

    private tempVector = new Vector2();
    private getCurrentDrag(pointerID: number): Vector2 {
        if (!this.isDragging) {
            return new Vector2();
        }

        const input = this.context.input;
        this.tempVector.copy(input.getPointerPosition(pointerID)!);
        const drag = this.tempVector.sub(this.dragStartPos);

        return drag;
    }
}