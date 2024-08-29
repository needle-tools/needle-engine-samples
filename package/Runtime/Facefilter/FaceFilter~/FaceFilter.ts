import { AssetReference, Behaviour, ClearFlags, GameObject, getParam, ObjectUtils, serializable } from '@needle-tools/engine';
import { FilesetResolver, FaceLandmarker, DrawingUtils, FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { BlendshapeName, FacefilterUtils } from './utils.js';
import { MeshBasicMaterial, Object3D, Vector3, VideoTexture } from 'three';
import { NeedleRecordingHelper } from './RecordingHelper.js';
import { FaceBehaviour } from './FaceBehaviour.js';

export class Facefilter extends Behaviour {

    /**
     * The 3D object that will be attached to the face
     */
    @serializable(Object3D)
    asset: Object3D | undefined = undefined;

    /**
     * The occlusion mesh that will be used to hide 3D objects behind the face
     */
    @serializable(AssetReference)
    occlusionMesh: AssetReference | undefined = undefined;

    /**
     * The last result received from the face detector
     * @returns {FaceLandmarkerResult} the last result received from the face detector
     */
    get result(): FaceLandmarkerResult | null {
        return this._lastResult;
    }
    /**
     * Get the blendshape value for a given name
     * @param shape the name of the blendshape e.g. JawOpen
     * @param index the index of the face to get the blendshape from. Default is 0
     * @returns the blendshape score for a given name e.g. JawOpen. -1 if not found
     */
    getBlendshapeValue(shape: BlendshapeName, index: number = 0): number {
        return FacefilterUtils.getBlendshapeValue(this._lastResult, shape, index);
    }


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
        // create and start the video playback
        this._video = document.createElement("video");
        this._video.autoplay = true;
        this._video.playsInline = true;
        this._video.style.display = "none";
        this.startWebcam(this._video);
    }
    /** @internal */
    onEnable(): void {
        if (this.asset) {
            this.asset.visible = false;
        }
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
        video.muted = true;
        video.play();
        video.addEventListener("loadeddata", () => {
            this._videoReady = true;
            NeedleRecordingHelper.createButton(this.context);
        });
        // Create a video texture that will be used to render the video feed
        this._videoTexture ??= new VideoTexture(video);
        this._videoTexture.colorSpace = this.context.renderer.outputColorSpace;
        this._farplaneQuad ??= ObjectUtils.createPrimitive("Quad", {
            parent: this.context.mainCamera,
            rotation: new Vector3(Math.PI, Math.PI, 0),
            material: new MeshBasicMaterial({ map: this._videoTexture, depthTest: false, depthWrite: false }),
        });
        this._farplaneQuad.renderOrder = -1;
    }


    /** assigned when the occluder is being created */
    private _occluderPromise: Promise<Object3D> | null = null;
    private _occluder: Object3D | null = null;

    /** The last landmark result received */
    private _lastResult: FaceLandmarkerResult | null = null;

    earlyUpdate(): void {
        if (!this._video?.srcObject || !this._landmarker) return;
        if (!this._videoReady) return;
        if (this._video.currentTime === this._lastVideoTime) return;
        this._lastVideoTime = this._video.currentTime;
        const results = this._landmarker.detectForVideo(this._video, performance.now());
        this._lastResult = results;
        this.onResultsUpdated();
    }

    /** @internal */
    onBeforeRender(): void {
        const results = this._lastResult;
        if (!results) return;

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

    /**
     * Called when the face detector has a new result
     */
    protected onResultsUpdated() {
        if (this.asset) {
            const attachment = this.asset.getComponent(FaceBehaviour);
            if (attachment) {
                attachment.onResultUpdated(this);
            }
        }
    }

    private updateRendering(res: FaceLandmarkerResult) {

        if (res.facialTransformationMatrixes.length <= 0) return;

        if (this.asset) {
            const lm = res.facialTransformationMatrixes[0];
            const obj = this.asset;
            obj.visible = true;
            FacefilterUtils.applyFaceLandmarkMatrixToObject3D(obj, lm, this.context.mainCamera);
            if (!this._occluder) {
                this.createOccluder();
            }
            else {
                FacefilterUtils.applyFaceLandmarkMatrixToObject3D(this._occluder, lm, this.context.mainCamera);
            }
        }

    }

    private createOccluder() {
        // If a occlusion mesh is assigned
        if (this.occlusionMesh) {
            // Request the occluder mesh once
            if (!this._occluderPromise) {
                this._occluderPromise = this.occlusionMesh.loadAssetAsync();
                this._occluderPromise.then((occluder) => {
                    this._occluder = new Object3D();
                    this._occluder.add(occluder);
                    FacefilterUtils.makeOccluder(occluder);
                });
            }
        }
        // Fallback occluder mesh if no custom occluder is assigned
        else {
            this._occluder = new Object3D();
            const mesh = ObjectUtils.createOccluder("Sphere");
            // mesh.material.colorWrite = true;
            mesh.scale.x = .16;
            mesh.scale.y = .3;
            mesh.scale.z = .17;
            mesh.position.z = -.04;
            mesh.renderOrder = -1;
            mesh.updateMatrix();
            mesh.updateMatrixWorld();
            mesh.matrixAutoUpdate = false;
            this._occluder.add(mesh);
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
                FacefilterUtils.applyFaceLandmarkMatrixToObject3D(obj, data, this.context.mainCamera);
            }
        }
    }

}

