import { Behaviour } from "@needle-tools/engine";
import { PointerEventData, IPointerEventHandler } from "@needle-tools/engine";
import { WebXRController, ControllerEvents } from "@needle-tools/engine";

export class ClickToOpenWebsite extends Behaviour implements IPointerEventHandler {

    url: string | null = null;
    keepQuery: boolean = false;
    keepHash: boolean = false;
    openNewTab: boolean = false;

    awake(): void {
        WebXRController.addEventListener(ControllerEvents.SelectStart, (_controller, args: { selected: THREE.Object3D }) => {
            if (args.selected === this.gameObject) {
                this.onClick();
            }
        })
    }

    private lastClickTime: number = 0;

    onClick() {
        // hack/workaround until we support onclick for xr controllers
        if (this.context.time.time - this.lastClickTime < .3) return;
        this.lastClickTime = this.context.time.time;

        if (!this.url || this.url.length <= 0) {
            this.url = window.location.href;
        }

        if (this.url) {
            const targetUrl = new URL(this.url);
            if (this.keepQuery) {
                if (targetUrl.search) targetUrl.search += "&" + window.location.search.substring(1);
                else targetUrl.search = window.location.search;
            }
            if (this.keepHash) {
                if (targetUrl.hash) targetUrl.hash += "&" + window.location.hash.substring(1);
                else targetUrl.hash = window.location.hash;
            }
            window.open(targetUrl, this.openNewTab ? "_blank" : "_self");
        }
    }

    onPointerClick(args: PointerEventData) {
        this.onClick();
        args.Use();
    }

    onPointerEnter() {
        this.context.input.setCursorPointer();
    }

    onPointerExit() {
        this.context.input.setCursorNormal();
    }
}
