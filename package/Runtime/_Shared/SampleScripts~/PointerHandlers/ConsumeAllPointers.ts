import { Behaviour, IPointerEventHandler, PointerEventData, serializable } from '@needle-tools/engine';

export class ConsumeAllPointers extends Behaviour implements IPointerEventHandler {
    @serializable()
    consumeClick: boolean = true;

    @serializable()
    consumeDown: boolean = true;

    @serializable()
    consumeMove: boolean = true;

    @serializable()
    consumeUp: boolean = true;

    @serializable()
    consumeHover: boolean = true;

    onPointerDown(event: PointerEventData): void {
        if (this.consumeDown)
            event.use();
    }

    onPointerMove(event: PointerEventData): void {
        if (this.consumeMove)
            event.use();
    }

    onPointerUp(event: PointerEventData): void {
        if (this.consumeUp)
            event.use();
    }

    onPointerClick(event: PointerEventData): void {
        if (this.consumeClick)
            event.use();
    }

    onPointerEnter(event: PointerEventData): void {
        if (this.consumeHover)
            event.use();
    }

    onPointerExit(event: PointerEventData): void {
        if (this.consumeHover)
            event.use();
    }
}
