import { Behaviour, ButtonsFactory, EventList, serializable } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class HTMLMenu extends Behaviour {

    @serializable(EventList)
    methods?: Array<EventList>;

    @serializable()
    names?: Array<string>;

    private createdElements: Array<HTMLElement> = [];

    onEnable(): void {
        if (!this.methods || !this.names) return;

        for (let i = 0; i < this.methods.length; i++) {
            const method = this.methods[i];
            let niceName = "Button";
            if (i < this.names?.length)
                niceName = this.names[i];
            const buttonElement = document.createElement("button");
            buttonElement.innerHTML = niceName;
            buttonElement.onclick = () => {
                method.invoke();
            }
            this.context.menu.appendChild(buttonElement);
            this.createdElements.push(buttonElement);
        }
    }

    onDisable(): void {
        for (const element of this.createdElements) {
            element.remove();
        }
    }

    /** Helper method that can be accessed from within integrations */
    reloadPageInSeconds(seconds: number) {
        setTimeout(() => {
            location.reload();
        }, seconds * 1000);
    }
}