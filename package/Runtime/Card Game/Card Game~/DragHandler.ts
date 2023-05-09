import { EventList, serializable } from "@needle-tools/engine";

export class DragHandler {

    @serializable(EventList)
    onStartDragging: EventList = new EventList();

    @serializable(EventList)
    onDrop: EventList = new EventList();

    private static _instance: DragHandler;

    static get instance() {
        if (!this._instance) {
            this._instance = new DragHandler();
        }
        return this._instance;
    }


    private static _data: any = null;
    static get data() { return this._data; }

    static startDragging(obj: any) {
        this._data = obj;
        this.instance.onStartDragging?.invoke();
    }

    static cancel(obj: any) {
        if (obj === this._data)
            this._data = null;
    }

    static drop() {
        const data = this._data;
        this._data = null;
        this.instance.onDrop?.invoke(data);
    }

}