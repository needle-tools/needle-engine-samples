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

    @serializable()
    stopPropagation: boolean = true;

    onPointerDown(event: PointerEventData): void {
        if (this.consumeDown)
            event.use();
        if (this.stopPropagation)
            event.stopPropagation();
    }

    onPointerMove(event: PointerEventData): void {
        if (this.consumeMove)
            event.use();
        if (this.stopPropagation)
            event.stopPropagation();
    }

    onPointerUp(event: PointerEventData): void {
        if (this.consumeUp)
            event.use();
        if (this.stopPropagation)
            event.stopPropagation();
    }

    onPointerClick(event: PointerEventData): void {
        if (this.consumeClick)
            event.use();
        if (this.stopPropagation)
            event.stopPropagation();
    }

    onPointerEnter(event: PointerEventData): void {
        if (this.consumeHover)
            event.use();
        if (this.stopPropagation)
            event.stopPropagation();
    }

    onPointerExit(event: PointerEventData): void {
        if (this.consumeHover)
            event.use();
        if (this.stopPropagation)
            event.stopPropagation();
    }
}
