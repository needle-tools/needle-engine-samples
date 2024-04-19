import { Behaviour, EventList, PointerEventData, serializable, IPointerDownHandler, IPointerUpHandler } from '@needle-tools/engine';

export class CarUIButton extends Behaviour implements IPointerDownHandler, IPointerUpHandler {
    @serializable(EventList)
    pressed!: EventList;

    @serializable(EventList)
    released!: EventList;

    onPointerDown(_args: PointerEventData) {
        this.pressed?.invoke();
    }

    onPointerUp(_args: PointerEventData) {
        this.released?.invoke();
    }
}