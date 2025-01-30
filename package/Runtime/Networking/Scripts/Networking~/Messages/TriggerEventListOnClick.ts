import { Behaviour, IPointerClickHandler, serializable, EventList, SendQueue } from "@needle-tools/engine";

type TriggerEventListOnClick_Model = {
    id: string;
}

const EventName = "EventListOnClick";

export class TriggerEventListOnClick extends Behaviour implements IPointerClickHandler {
    @serializable(EventList)
    onClicked?: EventList;

    private model: TriggerEventListOnClick_Model = { id: "" }

    onEnable(): void {
        this.context.connection.beginListen(EventName, this.onRemoteClick);
    }

    onDisable(): void {
        this.context.connection.stopListen(EventName, this.onRemoteClick);
    }

    onRemoteClick = (model: TriggerEventListOnClick_Model) => {
        if (model.id !== this.guid) return;
        this.onClicked?.invoke();
    }

    onPointerClick(_) {
        this.onClicked?.invoke();
        this.model.id = this.guid;
        this.context.connection.send(EventName, this.model);
    }
}
