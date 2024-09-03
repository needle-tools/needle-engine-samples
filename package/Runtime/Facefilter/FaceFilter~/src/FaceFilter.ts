import { AssetReference, Behaviour, ClearFlags, GameObject, getIconElement, getParam, isMobileDevice, Mathf, ObjectUtils, serializable, setParamWithoutReload, showBalloonMessage } from '@needle-tools/engine';
import { FilesetResolver, FaceLandmarker, DrawingUtils, FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { BlendshapeName, FacefilterUtils } from './utils.js';
import { MeshBasicMaterial, Object3D, Vector3, VideoTexture } from 'three';
import { NeedleRecordingHelper } from './RecordingHelper.js';
import { FaceFilterRoot } from './Behaviours.js';
import { mirror } from './settings.js';

export class NeedleFilterTrackingManager extends Behaviour {

    /**
     * The 3D object that will be attached to the face
     */
    @serializable(AssetReference)
    filters: AssetReference[] = [];

    /**
     * The occlusion mesh that will be used to hide 3D objects behind the face
     */
    @serializable(AssetReference)
    occlusionMesh: AssetReference | undefined = undefined;

    @serializable()
    createOcclusionMesh: boolean = true;

    @serializable()
    createMenuButton: boolean = true;


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


    selectNextFilter() {
        this.select((this._activeFilterIndex + 1) % this.filters.length);
    }
    selectPreviousFilter() {
        let index = this._activeFilterIndex - 1;
        if (index < 0) index = this.filters.length - 1;
        this.select(index);
    }
    select(index: number) {
        if (index >= 0 && index < this.filters.length && typeof index === "number") {
            this._activeFilterIndex = index;
            setParamWithoutReload("facefilter", index.toString());

            // preload the next filter
            const nextIndex = (index + 1) % this.filters.length;
            const nextFilter = this.filters[nextIndex];
            console.log("Preload Filter #" + nextIndex)
            nextFilter?.loadAssetAsync();

            return true;
        }
        return false;
    }



    /** Face detector */
    private _landmarker: FaceLandmarker | null = null;
    /** Input */
    private _video!: HTMLVideoElement;
    private _videoReady: boolean = false;
    private _lastVideoTime: number = -1;
    private _videoTexture: VideoTexture | null = null;
    private _videoQuad: Object3D | null = null;




    async awake() {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        ).catch((e) => {
            console.error(e);
            return null;
        });
        if (!vision) {
            console.error("Could not load vision tasks");
            return;
        }
        this._landmarker = await FaceLandmarker.createFromOptions(
            vision,
            {
                runningMode: "VIDEO",
                baseOptions: {
                    delegate: "GPU",
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
                },
                numFaces: 1, // TODO: we currently support only one face, most of the code is written with this assumption
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,

            }
        ).catch((e) => {
            console.error(e);
            console.error("Could not create face detector...");
            return null;
        });
        if (!this._landmarker) {
            return;
        }

        // create and start the video playback
        this._video = document.createElement("video");
        this._video.autoplay = true;
        this._video.playsInline = true;
        this._video.style.display = "none";
        this.startWebcam(this._video);
    }
    /** @internal */
    onEnable(): void {
        // Ensure our filters array is valid
        for (let i = this.filters.length - 1; i >= 0; i--) {
            const filter = this.filters[i];
            if (!filter) {
                this.filters.splice(i, 1);
                continue;
            }
            if (filter.asset) {
                filter.asset.visible = false;
            }
        }

        // Select initial filter, either from URL or choose a random one
        if (this._activeFilterIndex === -1) {
            const param = getParam("facefilter");
            let didSelect = false;
            if (typeof param === "string") {
                const i = parseInt(param);
                didSelect = this.select(i);
            }
            else if (typeof param === "number") {
                didSelect = this.select(param);
            }
            if (!didSelect) {
                const random = Math.floor(Math.random() * this.filters.length);
                this.select(random);
            }
        }

        this._debug = getParam("debugfacefilter") == true;
        window.addEventListener("keydown", this.onKeyDown);
        this._video?.play();
        this._buttons.forEach((button) => this.context.menu.appendChild(button));
        if (this._activeFilterBehaviour) {
            this._activeFilterBehaviour.enabled = true;
        }
    }
    /** @internal */
    onDisable(): void {
        window.removeEventListener("keydown", this.onKeyDown);
        this._video?.pause();
        this._buttons.forEach((button) => button.remove());
        this._videoQuad?.removeFromParent();
        if (this._activeFilterBehaviour) {
            this._activeFilterBehaviour.enabled = false;
        }
        this._activeFilter?.asset?.removeFromParent();
    }

    private async startWebcam(video: HTMLVideoElement) {
        const constraints = { video: true, audio: false };
        const stream = await navigator.mediaDevices.getUserMedia(constraints).catch((e) => {
            showBalloonMessage("Could not start webcam: " + e.message);
            console.error(e);
            return null;
        });
        if (stream == null) {
            console.warn("Could not start webcam");
            return;
        }
        video.srcObject = stream;
        video.muted = true;
        video.addEventListener("loadeddata", () => {
            this._videoReady = true;
            this.createUI();
        });
        // Create a video texture that will be used to render the video feed
        this._videoTexture ??= new VideoTexture(video);
        this._videoTexture.colorSpace = this.context.renderer.outputColorSpace;
        this._videoQuad ??= ObjectUtils.createPrimitive("Quad", {
            rotation: new Vector3(Math.PI, Math.PI, 0),
            material: new MeshBasicMaterial({ map: this._videoTexture, depthTest: false, depthWrite: false }),
        });
        this._videoQuad.renderOrder = -1;
    }

    private _activeFilterIndex: number = -1;
    private _activeFilter: AssetReference | null = null;
    private _activeFilterBehaviour: FaceFilterRoot | null = null;

    /** assigned when the occluder is being created */
    private _occluderPromise: Promise<Object3D> | null = null;
    private _occluder: Object3D | null = null;

    /** The last landmark result received */
    private _lastResult: FaceLandmarkerResult | null = null;
    private _lastResultTime: number = -1;

    earlyUpdate(): void {
        if (!this._video?.srcObject || !this._landmarker) return;
        if (!this._videoReady) return;
        if (this._video.currentTime === this._lastVideoTime) {
            // iOS hack: for some reason on Safari iOS the video stops playing sometimes. Playback state stays "playing" but currentTime does not change
            // So here we just restart the video every few frames to circumvent the issue for now
            if (this.context.time.frame % 20 === 0)
                this._video.play();
            return;
        }
        // Because of Safari iOS
        if (!("detectForVideo" in this._landmarker)) {
            return;
        }
        if (this._video.readyState < 2) return;
        this._lastVideoTime = this._video.currentTime;
        const results = this._landmarker.detectForVideo(this._video, performance.now());
        this._lastResult = results;
        this._lastResultTime = this.context.time.realtimeSinceStartup;
        this.onResultsUpdated(results);
    }

    /** @internal */
    onBeforeRender(): void {
        const results = this._lastResult;
        if (!results) return;

        // Currently we need to force the FOV
        if (this.context.mainCameraComponent) {
            this.context.mainCameraComponent.fieldOfView = 63;
            this.context.mainCameraComponent.clearFlags = ClearFlags.None;
            if (this._videoTexture && this._videoQuad) {
                if (this._videoQuad.parent !== this.context.mainCamera) {
                    this.context.mainCamera.add(this._videoQuad);
                }
                // this.context.scene.background = this._videoTexture;
                const far = this.context.mainCameraComponent.farClipPlane;
                this._videoQuad.renderOrder = -1000;
                this._videoQuad.position.z = -far + .01;
                let aspect = this._video.videoWidth / this._video.videoHeight;
                if (!mirror) {
                    aspect *= -1;
                }
                this._videoQuad.scale.set(aspect, -1, 1)
                    .multiplyScalar(far * Math.tan(this.context.mainCameraComponent.fieldOfView * Math.PI / 180 / 2) * 2);
            }
        }

        this.updateDebug(results);
        this.updateRendering(results);
    }

    private _lastTimeWithTrackingMatrices: number = -1;

    /**
     * Called when the face detector has a new result
     */
    protected onResultsUpdated(res: FaceLandmarkerResult) {

        // If we do not have any faces
        if (res.facialTransformationMatrixes.length <= 0) {
            // If we have an active filter and no tracking for a few frames, hide the filter
            if (this._activeFilter?.asset && (this.context.time.realtimeSinceStartup - this._lastTimeWithTrackingMatrices) > .5) {
                this._activeFilter.asset.removeFromParent();
            }
            return;
        }

        if (mirror) {
            if (res.faceBlendshapes) {
                for (const face of res.faceBlendshapes) {
                    const blendshapes = face.categories;
                    for (let i = 0; i < blendshapes.length; i++) {
                        const category = blendshapes[i];
                        if (category.categoryName.endsWith("Left")) {
                            // assuming Right is before Left so we 
                            // flip the blendshape score with the next one
                            // to mirror the blendshapes
                            const left = blendshapes[i + 1];
                            const right = blendshapes[i];
                            const tmp = left.score;
                            left.score = right.score;
                            right.score = tmp;
                        }
                    }
                }
            }
        }

        this._lastTimeWithTrackingMatrices = this.context.time.realtimeSinceStartup;
        const active = this.filters[this._activeFilterIndex];
        // If we have an active filter make sure it loads
        if (active != this._activeFilter && !active.asset) {
            active.loadAssetAsync();
        }
        else if (active?.asset) {
            // Check if the active filter is still the one that *should* be active/visible
            if (active !== this._activeFilter) {
                console.log("Switching to filter #" + this._activeFilterIndex);
                this._activeFilter?.asset?.removeFromParent();
                this._activeFilterBehaviour?.destroy();

                this._activeFilter = active; // < update the currently active
                this._activeFilterBehaviour = active.asset.getOrAddComponent(FaceFilterRoot);

                active.asset.visible = true;
                this.context.scene.add(active.asset);
            }

            if (this._activeFilter.asset.parent !== this.context.scene) {
                this._activeFilter.asset.visible = true;
                this.context.scene.add(this._activeFilter.asset);
            }
            this._activeFilterBehaviour!.onResultsUpdated(this);
        }
    }

    private updateRendering(res: FaceLandmarkerResult) {
        // TODO: allow filters to override this
        const lm = res.facialTransformationMatrixes[0];
        if (lm) {
            // Setup/manage occlusions
            if (this._activeFilterBehaviour?.overrideDefaultOccluder) {
                if (this._occluder) {
                    this._occluder.visible = false;
                }
            }
            else if (!this._occluder) {
                if (this.createOcclusionMesh) this.createOccluder();
            }
            else {
                this._occluder.visible = true;
                FacefilterUtils.applyFaceLandmarkMatrixToObject3D(this._occluder, lm, this.context.mainCamera);
            }
        }

    }

    private createOccluder(_force: boolean = false) {
        // If a occlusion mesh is assigned
        if (this.occlusionMesh) {
            // Request the occluder mesh once
            if (!this._occluderPromise) {
                this._occluderPromise = this.occlusionMesh.loadAssetAsync();
                this._occluderPromise.then((occluder) => {
                    this._occluder = new Object3D();
                    this._occluder.add(occluder);
                    FacefilterUtils.makeOccluder(occluder, -10);
                });
            }
        }
        // Fallback occluder mesh if no custom occluder is assigned
        else {
            this._occluder = new Object3D();
            const mesh = ObjectUtils.createOccluder("Sphere");
            // mesh.material.colorWrite = true;
            // mesh.material.wireframe = true;
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

    private _buttons: HTMLElement[] = [];

    private createUI() {
        if (!this.createMenuButton) return;
        // Create menu Buttons
        const recordingButton = NeedleRecordingHelper.createButton(this.context);
        this._buttons.push(recordingButton);

        if (this.filters.length > 1) {
            const nextFilterButton = this.context.menu.appendChild({
                label: "Next Filter",
                icon: "comedy_mask",
                onClick: () => {
                    this.selectNextFilter();
                }
            });
            this._buttons.push(nextFilterButton);
        }


        const shareButton = this.context.menu.appendChild({
            label: "Share",
            icon: "share",
            onClick: function () {
                if (isMobileDevice() && navigator.share) {
                    navigator.share({
                        title: "Needle Filter",
                        text: "Check this out",
                        url: window.location.href,
                    }).catch(e => {
                        // ignore cancel
                        console.warn(e);
                    });
                }
                else {
                    navigator.clipboard.writeText(window.location.href);
                    const element = this as HTMLElement;
                    element.innerText = "Copied";
                    element.prepend(getIconElement("done"));
                    setTimeout(() => {
                        element.innerText = "Share";
                        element.prepend(getIconElement("share"));
                    }, 2000)
                }
            }
        });
        this._buttons.push(shareButton);
    }


    private _debug = false;
    private _debugDrawing: DrawingUtils | null = null;
    private _debugContainer: HTMLDivElement | null = null;
    private _debugCanvas: HTMLCanvasElement | null = null;
    private _debugObjects: Object3D[] = [];

    private onKeyDown = (evt: KeyboardEvent) => {
        const key = evt.key.toLowerCase();
        if (this._debug && key) {
            this.toggleDebug();
        }
        switch (key) {
            case "d":
            case "arrowright":
                this.selectNextFilter();
                break;
            case "a":
            case "arrowleft":
                this.selectPreviousFilter();
                break;

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

