import { Behaviour, ClearFlags, RGBAColor } from "@needle-tools/engine";

export class VideoBackground extends Behaviour {

    async awake() {
        // create video element and put it inside the <needle-engine> component
        const video = document.createElement("video");
        video.style.cssText = `
            position: fixed;
            min-width: 100%;
            min-height: 100%;
            z-index: -1;
        `
        this.context.domElement.shadowRoot!.appendChild(video);

        // get webcam input
        const input = await navigator.mediaDevices.getUserMedia({ video: true })
        if (!input) return;
        video.srcObject = input;
        video.play();

        // make sure the camera background is transparent
        const camera = this.context.mainCameraComponent;
        if (camera) {
            camera.clearFlags = ClearFlags.SolidColor;
            camera.backgroundColor = new RGBAColor(125, 125, 125, 0);
        }
    }
}
