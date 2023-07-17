import { Behaviour, GameObject, WebXRImageTracking } from "@needle-tools/engine";



/** 
 * Displays images that are being tracked in this sample 
 * and creates a little HTML UI for downloading them for testing
 */
export class ImageTrackingDownloadUI extends Behaviour {

    private _ui: HTMLElement | null = null;

    awake() {
        // Find all ImageTracking components
        const components = GameObject.findObjectsOfType(WebXRImageTracking);
        const container = document.createElement("div");
        container.style.cssText = `
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

        for (const imageTracking of components) {
            this.createDownloadImageUI(imageTracking, container);
        }
    }

    update(): void {
        if (this.context.isInAR) {
            this._ui?.remove();
        }
        else if (this._ui && !this._ui.parentNode) {
            this.context.domElement.appendChild(this._ui!);
        }
    }

    private createDownloadImageUI(imageTracking: WebXRImageTracking, container: HTMLElement) {
        for (const imageModel of imageTracking.trackedImages) {
            if (!imageModel.image) continue;
            const a = document.createElement("a");
            a.href = imageModel.image;
            // const imgName = imageModel.image.split("/").pop();
            // a.setAttribute("download", imgName ?? "image.png");
            container.appendChild(a);
            const img = document.createElement("img");
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