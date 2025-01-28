import { Behaviour, ClearFlags, RGBAColor } from "@needle-tools/engine";

export class VideoBackground extends Behaviour {

    private _video: HTMLVideoElement | null = null;

    async onEnable() {
        // create video element and put it inside the <needle-engine> component
        this._video ??= document.createElement("video");
        this._video.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            object-fit: cover;
        `
        this.context.domElement.shadowRoot!.appendChild(this._video);

        // get webcam input
        const input = await navigator.mediaDevices.getUserMedia({ video: true })
        if (!input || !this.enabled) return;
        this._video.srcObject = input;
        this._video.play();
    }
    onDisable(): void {
        this._video?.pause();
        this._video?.remove();
    }
}
