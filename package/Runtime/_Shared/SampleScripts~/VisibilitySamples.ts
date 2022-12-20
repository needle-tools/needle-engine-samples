import { Behaviour, Renderer, serializable, showBalloonMessage } from "@needle-tools/engine";

export class ResetPositionOnInterval extends Behaviour {

    @serializable()
    interval : number = 3;

    start() {
        const pos = this.gameObject.position.clone();
        setInterval(() => {
            this.gameObject.position.copy(pos);
        }, this.interval * 1000);
    }
}

export class ToggleVisibility extends Behaviour {
    toggleRendererOnly: boolean = false;

    start() {
        setInterval(() => {
            showBalloonMessage("This is a sample for showing how to <a href=\"https://engine.needle.tools/docs/scripting.html#component-architecture\" target=\"_blank\">toggle visibility of a GameObject</a>");
            if (this.toggleRendererOnly) {
                const rend = this.gameObject.getComponent(Renderer);
                if (rend) rend.enabled = !rend.enabled;
            }
            else this.gameObject.visible = !this.gameObject.visible;
        }, 1000)
    }
}
