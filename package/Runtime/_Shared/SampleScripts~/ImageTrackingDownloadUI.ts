import { Behaviour, DeviceUtilities, GameObject, NeedleXREventArgs, WebXRImageTracking } from "@needle-tools/engine";



/** 
 * Displays images that are being tracked in this sample 
 * and creates a little HTML UI for downloading them for testing
 */
export class ImageTrackingDownloadUI extends Behaviour {

    private _ui: HTMLElement | null = null;

    onEnable() {
        this._ui?.remove();

        this._ui = this.context.menu.appendChild({
            onClick: () => {
                window.open("https://docs.needle.tools/image-tracking", "_blank");
            },
            title: "View Marker",
            label: "View Marker",
            icon: "image",
            priority: 1000,
        });
    }
    onDisable(): void {
        this._ui?.remove();
    }

    update(): void {
        if (this.context.isInAR) {
            this._ui?.remove();
        }
        else if (this._ui && !this._ui.parentNode) {
            this.context.menu.appendChild(this._ui);
        }
    }
}