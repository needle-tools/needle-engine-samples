// START MARKER using mediapipe with hands
import { FilesetResolver, HandLandmarker, HandLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { Behaviour, Mathf, serializable, showBalloonMessage } from "@needle-tools/engine";
import { ParticleSphere } from "./ParticleSphere";

export class MediapipeHands extends Behaviour {

    @serializable(ParticleSphere)
    spheres: ParticleSphere[] = [];

    private _video!: HTMLVideoElement;
    private _handLandmarker!: HandLandmarker;

    async awake() {
        showBalloonMessage("Initializing mediapipe...")

        const vision = await FilesetResolver.forVisionTasks(
            // path/to/wasm/root
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        this._handLandmarker = await HandLandmarker.createFromOptions(
            vision,
            {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
                    delegate: "GPU"
                },
                numHands: 2
            });
        //@ts-ignore
        await this._handLandmarker.setOptions({ runningMode: "VIDEO" });

        this._video = document.createElement("video");
        this._video.setAttribute("style", "max-width: 30vw; height: auto;");
        console.log(this._video);
        this._video.autoplay = true;
        this._video.playsInline = true;
        this.context.domElement.appendChild(this._video);
        this.startWebcam(this._video);
    }

    private _lastVideoTime: number = 0;

    update(): void {
        if (!this._video || !this._handLandmarker) return;
        const video = this._video;
        if (video.currentTime !== this._lastVideoTime) {
            let startTimeMs = performance.now();
            showBalloonMessage("<strong>Control the spheres with one or two hands</strong>!<br/><br/>Sample scene by <a href='https://twitter.com/llllkatjallll/status/1659280435023605773'>Katja Rempel</a>")
            const detections = this._handLandmarker.detectForVideo(video, startTimeMs);
            this.processResults(detections);
            this._lastVideoTime = video.currentTime;
        }

    }

    private processResults(results: HandLandmarkerResult) {
        const hand1 = results.landmarks[0];
        // check if we have even one hand
        if (!hand1) return;

        if (hand1.length >= 4 && this.spheres[0]) {
            const pos = hand1[4];
            this.processLandmark(this.spheres[0], pos);
        }

        // if we have a second sphere:
        if (this.spheres.length >= 2) {
            const hand2 = results.landmarks[1];
            if (!hand2) {
                const pos = hand1[8];
                this.processLandmark(this.spheres[1], pos);
            }
            else {
                const pos = hand2[4];
                this.processLandmark(this.spheres[1], pos);
            }
        }
    }

    private processLandmark(sphere: ParticleSphere, pos: NormalizedLandmark) {
        const px = Mathf.remap(pos.x, 0, 1, -6, 6);
        const py = Mathf.remap(pos.y, 0, 1, 6, -6);
        sphere.setTarget(px, py, 0);
    }

    private async startWebcam(video: HTMLVideoElement) {
        const constraints = { video: true, audio: false };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
    }
}
// END MARKER using mediapipe with hands