import { Behaviour,EventList,IPointerDownHandler, IPointerMoveHandler, IPointerUpHandler, Input, Mathf, PointerEventData, Rect, RectTransform, isMobileDevice, serializable } from "@needle-tools/engine";
import { Vector2, Vector3 } from "three";

export class Touchpad extends Behaviour implements IPointerDownHandler, IPointerUpHandler, IPointerMoveHandler
{
    @serializable(RectTransform)
    touchArea?: RectTransform;

    @serializable(EventList)
    onDrag: EventList = new EventList();

    @serializable(EventList)
    onClick: EventList = new EventList();

    @serializable()
    sensitivity: number = 1;

    @serializable()
    clickDeadzone: number = 15;

    private isDragging;
    private dragStartPos: Vector2 = new Vector2();

    onPointerDown(args: PointerEventData) {
        this.isDragging = true;
        
        const input = this.context.input;

        if(args.pointerId != undefined) {
            this.dragStartPos.copy(input.getPointerPosition(args.pointerId)!);
        }
    }

    onPointerUp(args: PointerEventData) {
        if(args.pointerId != undefined)
        {
            const drag = this.getCurrentDrag(args.pointerId);
            
            if (drag.length() < this.clickDeadzone) {
                this.onClick.invoke();
            }
        }

        this.isDragging = false;
    }

    onPointerMove(args: PointerEventData) {
        if((!this.isDragging) || args.pointerId == undefined) {
            return;
        }

        const input = this.context.input;
        const mousePosDelta = input.getPointerPositionDelta(args.pointerId);

        const drag = this.getCurrentDrag(args.pointerId);

        if(mousePosDelta && drag.length() > this.clickDeadzone)
        {
            mousePosDelta.multiplyScalar(this.sensitivity);
            this.onDrag.invoke(mousePosDelta);
        }
    }

    private getCurrentDrag(pointerID: number): Vector2 {

        if(!this.isDragging) {
            return new Vector2();
        }

        const input = this.context.input;
        const currentPos = input.getPointerPosition(pointerID)?.clone() || new Vector2();
        const drag = currentPos.sub(this.dragStartPos);

        return drag;
    }
}