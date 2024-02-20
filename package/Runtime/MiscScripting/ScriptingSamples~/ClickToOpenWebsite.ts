import { Behaviour, OpenURL, serializable } from "@needle-tools/engine";
import { IPointerEventHandler } from "@needle-tools/engine";

export class ClickToOpenWebsite extends Behaviour implements IPointerEventHandler {

    @serializable()
    url: string | null = null;
    @serializable()
    openNewTab: boolean = false;

    awake(): void {
        if (this.url) {
            console.warn("ClickToOpenWebsite: URL is deprecated: use OpenURL instead.");
            const openUrl = this.gameObject.addNewComponent(OpenURL)!;
            openUrl.url = this.url;
            openUrl.mode = this.openNewTab ? 0 : 1;
        }
    }
}
