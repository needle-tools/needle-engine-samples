import { Behaviour, DeviceUtilities, GameObject, NeedleXREventArgs, WebXRImageTracking } from "@needle-tools/engine";



/** 
 * Displays images that are being tracked in this sample 
 * and creates a little HTML UI for downloading them for testing
 */
export class ImageTrackingDownloadUI extends Behaviour {

    private _ui: HTMLElement | null = null;
    private _incubationsHint: HTMLElement | null = null;
    private _components: WebXRImageTracking[] = [];

    onEnable() {
        this._ui?.remove();

        // Find all ImageTracking components
        this._components = GameObject.findObjectsOfType(WebXRImageTracking);
        const container = document.createElement("div");
        container.style.cssText = `
            font-family: 'Roboto flex', Ariel;
            position: absolute;
            top: 1em;
            left: 1em;
            line-height: 1.5em;
            display: block;
            width: 200px;
        `
        this.context.domElement.appendChild(container);
        this._ui = container;

        const header = document.createElement("h2");
        header.style.cssText = `
            margin-bottom: .7em;
        `
        header.innerText = "Sample Images";
        container.appendChild(header);

        const description = document.createElement("p");
        description.innerHTML = `Download the image and print it or you can also open the image in your browser
        <br><strong>Then enter AR and scan it with your camera.</strong>
        <br>Visit our <a target="_blank" href="https://docs.needle.tools/image-tracking">ImageTracking documentation</a> for more information.
        `;
        description.style.userSelect = "all";
        container.appendChild(description);

        for (const imageTracking of this._components) {
            this.createDownloadImageUI(imageTracking, container);
        }
    }
    onDisable(): void {
        this._ui?.remove();
    }

    update(): void {
        if (this.context.isInAR) {
            this._ui?.remove();
        }
        else if (this._ui && !this._ui.parentNode) {
            this.context.domElement.appendChild(this._ui!);
        }
    }

    onUpdateXR(args: NeedleXREventArgs): void {
        if (args.xr.frame && !("getImageTrackingResults" in args.xr.frame)) {
            if (!this._incubationsHint && this._ui && DeviceUtilities.isAndroidDevice()) {
                const hint = document.createElement("p");
                hint.style.cssText = `
                    background: rgba(255, 100, 100, .7);
                    border-radius: .5rem;
                    padding: .4rem;
                `
                hint.innerText = "WebXR ImageTracking is not enabled. Go to chrome://flags/#webxr-incubations and enable #webxr-incubations";
                this._ui.append(hint);
                this._incubationsHint = hint;
            }
        }
    }

    private createDownloadImageUI(imageTracking: WebXRImageTracking, container: HTMLElement) {
        if (!imageTracking.trackedImages) return;
        for (const imageModel of imageTracking.trackedImages) {
            if (!imageModel.image) continue;
            const a = document.createElement("a") as HTMLAnchorElement;
            a.href = imageModel.image;
            a.target = "_blank";
            // const imgName = imageModel.image.split("/").pop();
            // a.setAttribute("download", imgName ?? "image.png");
            container.appendChild(a);
            const img = document.createElement("img") as HTMLImageElement;
            img.src = imageModel.image;
            img.style.cssText = `
                min-width: 180px;
                max-width: 220px;
                width: 15vw;
                height: auto;
                aspect-ratio: 1.3;
                object-fit: cover;
                background: rgba(0,0,0,0.5);
                border-radius: 10px;
                border: 2px solid rgba(255,255,255,1);
                box-shadow: 0 0 10px rgba(0,0,0,.2);
                margin-left: -.5em;
            `
            a.appendChild(img);
        }
    }

}