import { Behaviour, EventList, serializable, serializeable } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class HTMLButtonClick extends Behaviour {

    @serializeable()
    htmlSelector: string = "button.some-button";
    
    @serializable(EventList)
    onClick: EventList = new EventList();

    private element? : HTMLButtonElement;
    private method? : (this: HTMLButtonElement, ev: MouseEvent) => any;

    onEnable() {
        this.element = document.querySelector(this.htmlSelector) as HTMLButtonElement;
        if (this.element) {
            this.method = this.click.bind(this);
            this.element.addEventListener('click', this.method);
        }
    }

    onDisable() {
        if (this.element && this.method) {
            this.element.removeEventListener('click', this.method);
        }
    }

    click() {
        this.onClick.invoke();
    }
}