import { Behaviour, EventList, IPointerEventHandler, serializable } from "@needle-tools/engine";

export class CarUIButton extends Behaviour implements IPointerEventHandler {
    @serializable(EventList)
    pointerDown?: EventList;

    @serializable(EventList)
    pointerUp?: EventList;

    onPointerDown() {
        this.pointerDown?.invoke();
    }

    onPointerUp() {
        this.pointerUp?.invoke();
    }
}