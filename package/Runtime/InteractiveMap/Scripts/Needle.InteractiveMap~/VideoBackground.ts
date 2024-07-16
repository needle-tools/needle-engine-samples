import { AudioSource, Behaviour, serializable } from "@needle-tools/engine";
import { LinearFilter, MeshBasicMaterial, PerspectiveCamera, SRGBColorSpace, VideoTexture } from "three";

// Documentation → https://docs.needle.tools/scripting

export class VideoBackground extends Behaviour {

    private video?: HTMLVideoElement;
    
    async onEnable() {
        // request and display a webcam world-facing video feed
        const video = document.createElement("video");
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.srcObject = await navigator.mediaDevices.getUserMedia({video: {facingMode: "environment"}});
        AudioSource.registerWaitForAllowAudio(() => {
            video.play();
        });
        
        this.video = video;

        const texture = new VideoTexture(video);
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        // color space
        texture.colorSpace = SRGBColorSpace;


        // new material for the video
        const mat = new MeshBasicMaterial({
            map: texture, 
            transparent: false, 
            depthWrite: false, 
            depthTest: false
        });
        texture.repeat.set(1, -1);
        texture.offset.set(0, 1);
        this.gameObject.material = mat;
        this.gameObject.renderOrder = -100000;
    }

    onBeforeRender(): void {

        const cam = this.context.mainCamera as PerspectiveCamera;
        if (!cam) return;

        // move to far plane
        this.gameObject.transform.position.z = cam.far * 0.5;
        // scale to match aspect ratio
        if (this.video) {
            // adjust height so that the video fits the screen
            const aspect = this.video.videoWidth / this.video.videoHeight;
            const height = cam.far * Math.tan(cam.fov * Math.PI / 360) * 1;
            this.gameObject.scale.set(aspect * height, height, 1);
        }
    }
}