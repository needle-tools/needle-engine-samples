import { Behaviour, IPointerClickHandler, serializable, EventList, SendQueue } from "@needle-tools/engine";

export class TriggerEventListOnClick extends Behaviour implements IPointerClickHandler { 
    @serializable(EventList)
    onClicked?: EventList;

    private msgId = "EventListOnClick";
    private onClickMsgHandler: any;

    private model = new TriggerEventListOnClick_Model();

    onEnable(): void {
        this.onClickMsgHandler = this.handleOnClickMsg.bind(this);
        this.context.connection.beginListen(this.msgId, this.onClickMsgHandler);
    }
    
    onDisable(): void {
        this.context.connection.stopListen(this.msgId, this.onClickMsgHandler);
    }

    handleOnClickMsg(model: TriggerEventListOnClick_Model) {
        if(model.id !== this.guid) return;

        this.callEventList();
    }

    onPointerClick(_) {
        this.callEventList();

        this.model.id = this.guid;
        this.context.connection.send(this.msgId, this.model);
    }

    private callEventList() { 
        this.onClicked?.invoke();
    }
}

class TriggerEventListOnClick_Model {
    id: string = "";
}