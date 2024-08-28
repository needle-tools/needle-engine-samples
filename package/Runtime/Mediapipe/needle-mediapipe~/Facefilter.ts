import { AssetReference, Behaviour, ClearFlags, getParam, ObjectUtils, serializable } from '@needle-tools/engine';
import { FilesetResolver, FaceLandmarker, DrawingUtils, FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { NeedleMediaPipeUtils } from './utils.js';
import { Matrix4, MeshBasicMaterial, Object3D, Vector3, VideoTexture } from 'three';

export class Facefilter extends Behaviour {

    @serializable(Object3D)
    asset: Object3D | undefined = undefined;


    /** Face detector */
    private _landmarker!: FaceLandmarker;
    /** Input */
    private _video!: HTMLVideoElement;
    private _videoReady: boolean = false;
    private _lastVideoTime: number = -1;
    private _videoTexture: VideoTexture | null = null;
    private _farplaneQuad: Object3D | null = null;



    async awake() {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        this._landmarker = await FaceLandmarker.createFromOptions(
            vision,
            {
                runningMode: "VIDEO",
                numFaces: 1,
                baseOptions: {
                    delegate: "GPU",
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,

            }
        );

        await this._landmarker.setOptions({ runningMode: "VIDEO" });

        this._video = document.createElement("video");
        this._video.autoplay = true;
        this._video.playsInline = true;
        this._video.style.display = "none";
        this.startWebcam(this._video);
    }
    /** @internal */
    onEnable(): void {
        this._debug = getParam("debugfacefilter") == true;
        window.addEventListener("keydown", this.onKeyDown);
        this._video?.play();
    }
    /** @internal */
    onDisable(): void {
        window.removeEventListener("keydown", this.onKeyDown);
        this._video?.pause();
    }

    private async startWebcam(video: HTMLVideoElement) {
        const constraints = { video: true, audio: false };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.addEventListener("loadeddata", () => { this._videoReady = true; });
        this._videoTexture = new VideoTexture(video);
        this._videoTexture.colorSpace = this.context.renderer.outputColorSpace;
        this._farplaneQuad = ObjectUtils.createPrimitive("Quad", {
            parent: this.context.mainCamera,
            rotation: new Vector3(Math.PI, Math.PI, 0),
            material: new MeshBasicMaterial({ map: this._videoTexture, depthTest: false, depthWrite: false }),
        });
        this._farplaneQuad.renderOrder = -1;
    }


    private _occluder: Object3D | null = null;
    private _lastResult: FaceLandmarkerResult | null = null;

    /** @internal */
    onBeforeRender(): void {
        if (!this._video?.srcObject || !this._landmarker) return;
        if (!this._videoReady) return;
        if (this._video.currentTime === this._lastVideoTime) return;
        this._lastVideoTime = this._video.currentTime;
        let startTimeMs = performance.now();
        const results = this._landmarker.detectForVideo(this._video, startTimeMs);
        this._lastResult = results;

        // Currently we need to force the FOV
        if (this.context.mainCameraComponent) {
            this.context.mainCameraComponent.fieldOfView = 63;
            this.context.mainCameraComponent.clearFlags = ClearFlags.None;
            if (this._videoTexture && this._farplaneQuad) {
                // this.context.scene.background = this._videoTexture;
                const far = this.context.mainCameraComponent.farClipPlane;
                this._farplaneQuad.position.z = -far + .01;
                const aspect = this._video.videoWidth / this._video.videoHeight;
                this._farplaneQuad.scale.set(-aspect, -1, 1).multiplyScalar(far * Math.tan(this.context.mainCameraComponent.fieldOfView * Math.PI / 180 / 2) * 2);
            }
        }

        this.updateDebug(results);
        this.updateRendering(results);
    }

    private updateRendering(res: FaceLandmarkerResult) {

        if (res.facialTransformationMatrixes.length <= 0) return;

        if (this.asset) {
            const lm = res.facialTransformationMatrixes[0];
            const obj = this.asset;
            NeedleMediaPipeUtils.applyFaceLandmarkMatrixToObject3D(obj, lm, this.context.mainCamera);
            if (!this._occluder) {
                this._occluder = new Object3D();
                const mesh = ObjectUtils.createOccluder("Sphere");
                // mesh.material.colorWrite = true;
                mesh.scale.x = .16;
                mesh.scale.y = .3;
                mesh.scale.z = .15;
                mesh.position.z = -.03;
                mesh.renderOrder = -1;
                this._occluder.add(mesh);
            }
            NeedleMediaPipeUtils.applyFaceLandmarkMatrixToObject3D(this._occluder, lm, this.context.mainCamera);
        }

    }


    private _debug = false;
    private _debugDrawing: DrawingUtils | null = null;
    private _debugContainer: HTMLDivElement | null = null;
    private _debugCanvas: HTMLCanvasElement | null = null;
    private _debugObjects: Object3D[] = [];

    private onKeyDown = (evt: KeyboardEvent) => {
        if (evt.key.toLowerCase() === "d") {
            this.toggleDebug();
        }
    }
    private toggleDebug = () => {
        this._debug = !this._debug;
    }
    private updateDebug(res: FaceLandmarkerResult) {
        if (!this._video) return;
        if (!this._debug) {
            if (this._debugContainer) {
                this._debugContainer.style.display = "none";
            }
            for (const obj of this._debugObjects) {
                obj.removeFromParent();
            }
            this._debugObjects.length = 0;
            return;
        }

        if (!this._debugDrawing) {
            this._debugContainer = document.createElement("div");
            this._debugCanvas = document.createElement("canvas");
            const ctx = this._debugCanvas.getContext("2d");
            if (!ctx) return;
            this._debugDrawing = new DrawingUtils(ctx);

            this.context.domElement.appendChild(this._debugContainer);
            this._debugContainer.appendChild(this._video);
            this._debugContainer.appendChild(this._debugCanvas);
            this._debugContainer.style.cssText = `
                pointer-events: none;
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                width: 100%;
                height: 100%;
                padding: 0;
                overflow: hidden;
            `;
            this._video.style.cssText = `
                position: absolute;
                min-height: 100%;
                height: auto;
                width: auto;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: block;
                opacity: .5;
            `;
            this._debugCanvas.style.cssText = this._video.style.cssText;

        };
        if (this._debugContainer)
            this._debugContainer.style.display = "";
        if (this._debugCanvas) {
            this._debugCanvas.width = this._video.videoWidth;
            this._debugCanvas.height = this._video.videoHeight;
            const ctx = this._debugCanvas.getContext("2d");
            ctx?.clearRect(0, 0, this._debugCanvas.width, this._debugCanvas.height);
        }
        res.faceLandmarks?.forEach((landmarks) => {
            this._debugDrawing?.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_CONTOURS, { color: "#55FF44", lineWidth: 1 });
        });

        if (res.faceLandmarks.length > 0) {
            for (let i = 0; i < res.facialTransformationMatrixes.length; i++) {
                if (!this._debugObjects[i]) {
                    const obj = new Object3D();
                    ObjectUtils.createPrimitive("ShaderBall", {
                        parent: obj,
                        scale: .3, // 30 cm
                    });
                    this._debugObjects[i] = obj;
                }
                const obj = this._debugObjects[i];
                const data = res.facialTransformationMatrixes[i];
                NeedleMediaPipeUtils.applyFaceLandmarkMatrixToObject3D(obj, data, this.context.mainCamera);
            }
        }
    }

}

