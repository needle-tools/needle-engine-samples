import { AssetReference, Behaviour, ClearFlags, GameObject, getIconElement, getParam, instantiate, isDevEnvironment, isMobileDevice, ObjectUtils, PromiseAllWithErrors, serializable, setParamWithoutReload, showBalloonMessage } from '@needle-tools/engine';
import { FaceLandmarker, DrawingUtils, FaceLandmarkerResult, PoseLandmarker, PoseLandmarkerResult, ImageSegmenter, ImageSegmenterResult, Matrix } from "@mediapipe/tasks-vision";
import { BlendshapeName, FacefilterUtils, MediapipeHelper } from './utils.js';
import { Object3D, Texture } from 'three';
import { NeedleRecordingHelper } from './RecordingHelper.js';
import { FaceFilterRoot } from './Behaviours.js';
import { mirror } from './settings.js';
import { VideoRenderer } from './VideoRenderer.js';


declare type VideoClip = string;

export class NeedleFilterTrackingManager extends Behaviour {

    /**
     * When enabled the max faces will be reduced if the performance is low
     */
    autoManagePerformance: boolean = true;

    /**
     * The maximum number of faces that will be tracked
     */
    @serializable()
    maxFaces: number = 1;

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

    /**
     * When enabled menu buttons for Recording, Switching Filters and Sharing will be created
     */
    @serializable()
    createMenuButton: boolean = true;

    /** Assign a texture to display your logo in the recorded video.   
     * Note: this requires an active PRO license: https://needle.tools/pricing
     */
    // @nonSerialized
    @serializable(Texture)
    customLogo: Texture | null = null;

    /** The name of the downloaded video. If null the video will not be downloadable  
     * Note: this requires an active PRO license: https://needle.tools/pricing
     */
    // @nonSerialized
    downloadName: string | null = null;


    /**
     * Test videos that can be used to test the face tracking. This is only available in development mode
     */
    @serializable(URL)
    testVideo: VideoClip[] | null = null;

    /**
     * Get access to the currently playing video. This is the camera by default
     */
    get video() {
        return this._video;
    }
    /** Width of the current video in pixel */
    get videoWidth() {
        return this._video.videoWidth;
    }
    /** Height of the current video in pixel */
    get videoHeight() {
        return this._video.videoHeight;
    }

    /**
     * The last result received from the face detector
     * @returns {FaceLandmarkerResult} the last result received from the face detector
     */
    get facelandmarkerResult(): FaceLandmarkerResult | null {
        return this._lastFaceLandmarkResults;
    }

    /** # Experimental, do not use yet
     * The last result received from the pose detector - this can be used to get the segmentation mask
     */
    get poselandmarkerResult(): PoseLandmarkerResult | null {
        return this._lastPoseLandmarkResults;
    }
    /** # Experimental, do not use yet
     * The last result received from the image segmentation */
    get lastImageSegmentationResults(): ImageSegmenterResult | null {
        return this._lastImageSegmentationResults;
    }

    /**
     * Get the blendshape value for a given name
     * @param shape the name of the blendshape e.g. JawOpen
     * @param index the index of the face to get the blendshape from. Default is 0
     * @returns the blendshape score for a given name e.g. JawOpen. -1 if not found
     */
    getBlendshapeValue(shape: BlendshapeName, index: number = 0): number {
        return FacefilterUtils.getBlendshapeValue(this._lastFaceLandmarkResults, shape, index);
    }


    selectNextFilter() {
        this.select((this._activeFilterIndex + 1) % this.filters.length);
    }
    selectPreviousFilter() {
        let index = this._activeFilterIndex - 1;
        if (index < 0) index = this.filters.length - 1;
        this.select(index);
    }
    // select(index: string);
    // select(index: number);
    select(index: number) {
        // if (typeof index === "string") {
        //     index = this.findIndex(index);
        // }
        if (index >= 0 && index < this.filters.length && typeof index === "number") {
            this._activeFilterIndex = index;
            setParamWithoutReload("facefilter", index > 0 ? index.toString() : null);

            // preload the next filter
            const nextIndex = (index + 1) % this.filters.length;
            const nextFilter = this.filters[nextIndex];
            console.debug("Preload Filter #" + nextIndex)
            nextFilter?.loadAssetAsync();

            return true;
        }
        return false;
    }
    get currentFilterIndex() {
        return this._activeFilterIndex;
    }
    // private findIndex(str: string): number {
    //     for (let i = 0; i < this.filters.length; i++) {
    //         const filter = this.filters[i];
    //         if (filter?.url?.includes(str)) {
    //             return i;
    //         }
    //     }
    //     return 0;
    // }

    /**
     * @returns the internal face landmarker instance (if any). This accessor can be used to modify the face detector options via the `setOptions` method
     */
    get faceLandmarker() {
        return this._facelandmarker;
    }


    /** Face detector */
    private _facelandmarker: FaceLandmarker | null = null;

    /**  Pose detector / provides segmentation  */
    private _poselandmarker: PoseLandmarker | null = null;

    private _imageSegmentation: ImageSegmenter | null = null;

    /** Input */
    private _video!: HTMLVideoElement;
    private _videoReady: boolean = false;
    private _lastVideoTime: number = -1;

    private _videoRenderer: VideoRenderer | null = null;



    async awake() {
        const tasks = new Array<Promise<any>>();

        tasks.push(MediapipeHelper.createFaceLandmarker({
            maxFaces: this.maxFaces,
            // canvas: this.context.renderer.domElement,
        }).then(res => this._facelandmarker = res));

        // TODO: doesn't work yet 
        // tasks.push(MediapipeHelper.createPoseLandmarker({
        //     // canvas: this.context.renderer.domElement,
        // }).then(res => this._poselandmarker = res));

        // tasks.push(MediapipeHelper.createImageSegmentation({
        //     // canvas: this.context.renderer.domElement,
        // }).then(res => this._imageSegmentation = res));

        console.debug("Loading detectors...");
        await PromiseAllWithErrors(tasks);
        console.debug("Detectors loaded!");

        // create and start the video playback
        this._video = document.createElement("video");
        this._video.autoplay = true;
        this._video.playsInline = true;
        this._video.style.display = "none";
        this.startCamera(this._video);
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
                // const random = Math.floor(Math.random() * this.filters.length);
                this.select(0);
            }
        }

        this._debug = getParam("debugfacefilter") == true;
        window.addEventListener("keydown", this.onKeyDown);
        this._video?.play();
        this._videoRenderer?.enable();
        this._buttons.forEach((button) => this.context.menu.appendChild(button));
        this._states.forEach((state) => state.remove());
    }
    /** @internal */
    onDisable(): void {
        window.removeEventListener("keydown", this.onKeyDown);
        this._video?.pause();
        this._videoRenderer?.disable();
        this._buttons.forEach((button) => button.remove());
        this._states.forEach((state) => state.remove());
    }
    onDestroy(): void {
        this._facelandmarker?.close();
        this._poselandmarker?.close();
        this._imageSegmentation?.close();
    }

    private async startCamera(video: HTMLVideoElement) {
        // Use camera stream
        const constraints = { video: true, audio: false };
        const stream = await navigator.mediaDevices.getUserMedia(constraints).catch((e) => {
            showBalloonMessage("Could not start camera: " + e.message);
            console.warn("Could not start camera");
            return null;
        });
        video.srcObject = stream;
        video.muted = true;
        const onReady = () => {
            video.removeEventListener("loadeddata", onReady);
            console.debug("Video ready");
            this._videoReady = true;
            this.createUI();
        }
        video.addEventListener("loadeddata", onReady);


        // Create a video texture that will be used to render the video feed
        this._videoRenderer ??= new VideoRenderer(this);
        this._videoRenderer.enable();


        // Add UI for switching test videos
        if (isDevEnvironment()) {
            if (this.testVideo && this.testVideo.length > 0) {
                let currentIndex: number = getParam("testvideo") as number;
                if (typeof currentIndex != "number") currentIndex = -1;
                this.context.menu.appendChild({
                    label: "Switch Video (Dev)",
                    title: "Switch between test videos - this button is only visible in development mode (when you run your website in a local server)",
                    icon: "videocam",
                    onClick: () => {
                        let nextIndex = (currentIndex + 1);
                        if (nextIndex === this.testVideo!.length) {
                            currentIndex = -1;
                            video.srcObject = stream;
                            video.play();
                            setParamWithoutReload("testvideo", null);
                            return;
                        }
                        else if (nextIndex > this.testVideo!.length) {
                            nextIndex = 0;
                        }
                        setParamWithoutReload("testvideo", nextIndex.toString());
                        currentIndex = nextIndex;
                        setVideoFromURL(nextIndex);
                    }
                });
                const setVideoFromURL = (index: number) => {
                    const video = this._video;
                    const url = this.testVideo![index];
                    if (!url) {
                        console.debug("No test video found at index " + index);
                        return;
                    }
                    video.src = url;
                    video.srcObject = null;
                    video.play();
                }
                if (currentIndex >= 0) {
                    setVideoFromURL(currentIndex);
                }
            }
        }
    }



    private _activeFilterIndex: number = -1;

    private readonly _states: Array<FaceState> = [];

    private _lastTimeOptionsChanged: number = -1;
    private _currentMaxFaces: number = -1;

    /** The last landmark result received */
    private _lastFaceLandmarkResults: FaceLandmarkerResult | null = null;
    private _lastPoseLandmarkResults: PoseLandmarkerResult | null = null;
    private _lastImageSegmentationResults: ImageSegmenterResult | null = null;

    earlyUpdate(): void {
        if (!this._video) return;
        if (!this._videoReady) return;
        if (this._video.currentTime === this._lastVideoTime) {
            // iOS hack: for some reason on Safari iOS the video stops playing sometimes. Playback state stays "playing" but currentTime does not change
            // So here we just restart the video every few frames to circumvent the issue for now
            if (this.context.time.frame % 20 === 0)
                this._video.play();
            return;
        }
        if (this._video.readyState < 2) return;
        this._lastVideoTime = this._video.currentTime;


        // Auto reduce tracked faces count if performance is low
        if (this.autoManagePerformance) {
            if (this._currentMaxFaces == -1) { this._currentMaxFaces = this.maxFaces; }
            if (this.context.time.smoothedFps < 26 && this._currentMaxFaces > 1 && this.context.time.frame % 10 === 0) {
                if (this._lastTimeOptionsChanged == -1) this._lastTimeOptionsChanged = this.context.time.realtimeSinceStartup;
                if (this.context.time.realtimeSinceStartup - this._lastTimeOptionsChanged > 5) {
                    this._lastTimeOptionsChanged = this.context.time.realtimeSinceStartup;
                    this._currentMaxFaces -= 1;
                    console.warn("Reducing tracked faces to " + this.maxFaces + " due to low performance");
                    this._facelandmarker?.setOptions({
                        numFaces: this._currentMaxFaces,
                    });
                }
            }
        }

        // Update face results - the extra check is because of Safari iOS
        if (this._facelandmarker && ("detectForVideo" in this._facelandmarker)) {
            this._lastFaceLandmarkResults = this._facelandmarker.detectForVideo(this._video, performance.now());;
        }

        if (this._poselandmarker && ("detectForVideo" in this._poselandmarker)) {
            this._lastPoseLandmarkResults = this._poselandmarker.detectForVideo(this._video, performance.now());
        }
        if (this._imageSegmentation && ("segmentForVideo" in this._imageSegmentation)) {
            this._lastImageSegmentationResults = this._imageSegmentation.segmentForVideo(this._video, performance.now());
        }

        this.onResultsUpdated();
    }

    /** @internal */
    onBeforeRender(): void {

        // Currently we need to force the FOV
        if (this.context.mainCameraComponent) {
            this.context.mainCameraComponent.fieldOfView = 63;
            this.context.mainCameraComponent.clearFlags = ClearFlags.None;
            this._videoRenderer?.onUpdate();
        }

        const faceResults = this._lastFaceLandmarkResults;
        if (faceResults) {
            this.updateDebug(faceResults);

            for (let i = 0; i < faceResults.facialTransformationMatrixes.length; i++) {
                const state = this._states[i];
                const matrix = faceResults.facialTransformationMatrixes[i];
                state?.render(matrix);
            }
        }
    }

    private _blendshapeMirrorIndexMap: Map<number, number> | null = null;

    /**
     * Called when the face detector has a new result
     */
    protected onResultsUpdated() {

        const faceResults = this._lastFaceLandmarkResults;
        if (!faceResults) return;

        const matrices = faceResults.facialTransformationMatrixes;

        // Handle loosing face tracking
        for (let i = 0; i < this._states.length; i++) {
            if (i >= matrices.length) {
                const state = this._states[i];
                if ((this.context.time.realtimeSinceStartup - state.lastUpdateTime) > .5) {
                    state?.remove();
                }
            }
        }

        // If we do not have any faces
        if (faceResults.facialTransformationMatrixes.length <= 0) {
            return;
        }

        if (this.maxFaces > 1) {
            MediapipeHelper.applyFiltering(faceResults, this.context.time.time);
        }

        if (mirror) {
            if (faceResults.faceBlendshapes) {
                for (const face of faceResults.faceBlendshapes) {
                    const blendshapes = face.categories;
                    // Check if we have an index mirror map
                    // If not we iterate through the blendshapes and create a map once
                    if (this._blendshapeMirrorIndexMap == null) {
                        this._blendshapeMirrorIndexMap = new Map();
                        for (let i = 0; i < blendshapes.length; i++) {
                            const left = blendshapes[i];
                            // assuming Left is before Right so we 
                            if (left.categoryName.endsWith("Left")) {
                                // Search for the next Right blendshape:
                                for (let k = i + 1; k < blendshapes.length; k++) {
                                    const right = blendshapes[k];
                                    if (right.categoryName.endsWith("Right")) {
                                        if (this._debug) {
                                            console.log("Blendshape Mirror: " + left.categoryName + " ↔ " + right.categoryName);
                                        }
                                        this._blendshapeMirrorIndexMap.set(i, k);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    else {
                        for (const [leftIndex, rightIndex] of this._blendshapeMirrorIndexMap) {
                            const left = blendshapes[leftIndex];
                            const right = blendshapes[rightIndex];
                            if (left && right) {
                                const leftScore = left.score;
                                left.score = right.score;
                                right.score = leftScore;
                            }
                        }
                    }
                }
            }
        }

        const active = this.filters[this._activeFilterIndex];

        for (let i = 0; i < matrices.length; i++) {
            const state = this._states[i] ?? new FaceState(this);
            state.update(active, i);
            this._states[i] = state;
        }
    }

    private _buttons: HTMLElement[] = [];

    private createUI() {
        if (!this.createMenuButton) return;
        // Create menu Buttons
        const recordingButton = NeedleRecordingHelper.createButton({
            context: this.context,
            customLogo: this.customLogo,
            download_name: this.downloadName || undefined,
        });
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

        this._lastPoseLandmarkResults?.landmarks.forEach((landmarks) => {
            this._debugDrawing?.drawLandmarks(landmarks, { color: "#FF44FF", lineWidth: 1 });
        });
        // this._lastPoseLandmarkResults?.segmentationMasks?.forEach((mask) => {
        //     this._debugDrawing?.drawCategoryMask(mask, [[1, 1, 1, 1]]);
        // });

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
                const matrix = res.facialTransformationMatrixes[i];
                FacefilterUtils.applyFaceLandmarkMatrixToObject3D(obj, matrix, this.context.mainCamera);
            }
        }
    }

}


class FaceState {
    private readonly manager: NeedleFilterTrackingManager;

    get context() { return this.manager.context; }
    get lastUpdateTime() { return this._lastUpdateTime }
    private _lastUpdateTime: number = -1;

    constructor(manager: NeedleFilterTrackingManager) {
        this.manager = manager;
    }

    private filter: AssetReference | null = null;
    private instance: Object3D | null = null;
    private filterBehaviour: FaceFilterRoot | null = null;

    update(active: AssetReference | null, index: number) {
        if (!active) {
            return;
        }

        this._lastUpdateTime = this.context.time.realtimeSinceStartup;

        // If we have an active filter make sure it loads
        if (this.filter != active && !active.asset) {
            active.loadAssetAsync();
        }
        else if (active?.asset) {
            // Check if the active filter is still the one that *should* be active/visible
            if (active !== this.filter) {
                GameObject.remove(this.instance);
                this.filter = active; // < update the currently active
                this.instance = instantiate(active.asset);
                this.filterBehaviour = this.instance.getOrAddComponent(FaceFilterRoot);
                GameObject.add(this.instance, this.context.scene);
            }

            if (this.instance && this.instance.parent !== this.context.scene) {
                this.instance.visible = true;
                GameObject.add(this.instance, this.context.scene);
            }
            this.filterBehaviour!.onResultsUpdated(this.manager, index);
        }
    }

    render(matrix: Matrix) {
        // Setup/manage occlusions
        if (this.filterBehaviour?.overrideDefaultOccluder) {
            if (this.occluder) {
                this.occluder.visible = false;
            }
        }
        else if (!this.occluder) {
            if (this.manager.createOcclusionMesh) {
                this.createOccluder();
            }
        }
        else {
            this.occluder.visible = true;
            FacefilterUtils.applyFaceLandmarkMatrixToObject3D(this.occluder, matrix, this.manager.context.mainCamera);
        }
    }


    remove() {
        GameObject.remove(this.occluder);
        GameObject.remove(this.instance);
    }


    private occluderPromise: Promise<Object3D> | null = null;
    private occluder: Object3D | null = null;
    private createOccluder(_force: boolean = false) {
        // If a occlusion mesh is assigned
        if (this.manager.occlusionMesh) {
            // Request the occluder mesh once
            if (!this.occluderPromise) {
                this.occluderPromise = this.manager.occlusionMesh.loadAssetAsync() as Promise<Object3D>;
                this.occluderPromise.then((occluder) => {
                    this.occluder = new Object3D();
                    this.occluder.add(instantiate(occluder));
                    FacefilterUtils.makeOccluder(this.occluder, -10);
                });
            }
        }
        // Fallback occluder mesh if no custom occluder is assigned
        else {
            this.occluder = new Object3D();
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
            this.occluder.add(mesh);
        }
    }
}