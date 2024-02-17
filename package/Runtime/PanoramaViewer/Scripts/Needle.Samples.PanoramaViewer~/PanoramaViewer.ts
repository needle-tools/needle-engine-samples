import { Behaviour, ImageReference, Mathf, OrbitControls, PointerType, VideoPlayer, delay, findObjectOfType, serializable } from "@needle-tools/engine";
import { Texture, Material } from "three";
import * as THREE from "three";
import { GyroscopeControls } from "samples.sensors";
import { VideoRenderMode } from "@needle-tools/engine/src/engine-components/VideoPlayer";

export interface IPanoramaViewerMedia {
    data: string | Texture;
    info?: { 
        stereo?: boolean;
        type?: string | "image" | "video";
    };
}

// TODO: consult texture encoding sets
// TODO: consult why the material can't be just assigned and needs to be a apart of the scene
export class PanoramaViewer extends Behaviour {
    // @nonSerialized
    media: IPanoramaViewerMedia[] = [];

    @serializable()
    enableZoom: boolean = true;

    @serializable()
    zoomMin: number = 40;

    @serializable()
    zoomMax: number = 90;

    @serializable()
    zoomSensitivity: number = 0.1;

    @serializable()
    zoomSmoothing: number = 0.1;

    //@nonSerialized
    panoramaSize = 100;

    // @header Optional transition material
    @serializable(Material)
    optionalTransitionMaterial?: Material

    @serializable()
    transitionDuration: number = 0.3;

    @serializable()
    autoRotate: boolean = true;

    @serializable()
    autoRotateTimeout: number = 4;

    protected defaultMaterial = new THREE.MeshBasicMaterial();

    protected previousMedia?: IPanoramaViewerMedia;
    // @nonSerialized
    currentMedia?: IPanoramaViewerMedia;

    protected _i = 0;
    // @nonSerialized
    get index() {
        return Mathf.clamp(this._i, 0 , this.media.length - 1);
    }
    protected panoSphere?: THREE.Mesh;
    protected panoMaterial?: Material;

    protected optionalGyroControls?: GyroscopeControls;
    protected optionalOrbitalControls?: OrbitControls;

    protected _videoPlayer?: VideoPlayer;
    // @nonSerialized
    get videoPlayer(): VideoPlayer {
        this._videoPlayer ??= this.gameObject.addNewComponent(VideoPlayer)!;
        this._videoPlayer["renderMode"] = VideoRenderMode.RenderTexture;
        return this._videoPlayer;
    }

    protected transitionStartTimeStamp: number = Number.MAX_SAFE_INTEGER;
    protected hasLoadedMedia: boolean = true;
    // @nonSerialized
    isTransitioning: boolean = false;

    start() {
        this.panoSphere = this.createPanorama();
        this.gameObject.add(this.panoSphere);

        // TODO report: Can't use serialized reference or GetComponentInChildren? Results in a { guid } obj.
        this.optionalGyroControls = findObjectOfType(GyroscopeControls, this.context.scene, false);
        this.optionalOrbitalControls = findObjectOfType(OrbitControls, this.context.scene, false);

        this.select(0);
    }

    update(): void {
        if (this.enableZoom)
            this.handleZoom();

        /* console.log(this.context.mainCamera?.position); */

        this.updateTextureTransition();
        this.updateAutoRotate();
    }

    // @nonSerialized
    addImage(image: string | string[] | Texture | Texture[]) {
        const images = Array.isArray(image) ? image : [image];
        images.forEach(img => this.addMedia(({ data: img, info: { type: "image"} }) as IPanoramaViewerMedia));
    }

    // @nonSerialized
    addVideo(url: string | string[], isStereoVideo: boolean = false) {
        const urls = Array.isArray(url) ? url : [url];
        urls.forEach(url => this.addMedia(({ data: url, info: { type: "video", stereo: isStereoVideo } }) as IPanoramaViewerMedia));
    }
    
    // @nonSerialized
    addMedia(media: IPanoramaViewerMedia | IPanoramaViewerMedia[]) {
        this.media.push(...(Array.isArray(media) ? media : [ media ]));
    }

    protected previousPinchDistance: number | undefined = undefined;
    /* returns zoom delta */
    protected getZoomInput(): number {
        let delta = 0; 

        // PC - scrollwheel
        const input = this.context.input;
        delta = input.getMouseWheelDeltaY();

        // Touch - pinch
        if (input.getTouchesPressedCount() == 2) {
            const a = new THREE.Vector2();
            const b = new THREE.Vector2();
            for (const id of input.foreachPointerId(PointerType.Touch)) {
                const pos = input.getPointerPosition(id)!;
                b.copy(a);
                a.copy(pos);
            }

            const pinchDistance = a.distanceTo(b);
            if(this.previousPinchDistance) {
                delta += this.previousPinchDistance - pinchDistance;
            }
            this.previousPinchDistance = pinchDistance;
        }
        else 
            this.previousPinchDistance = undefined;

        // TODO: add vr controller support - joystick

        return delta;
    }

    protected zoomDeltaBuffer: number = 0;
    protected handleZoom() {
        const time = this.context.time;
        const delta = this.getZoomInput();

        this.zoomDeltaBuffer = Mathf.lerp(this.zoomDeltaBuffer, delta, time.deltaTime * this.zoomSmoothing);
        
        const cam = this.context.mainCameraComponent;
        const zoom = cam?.fieldOfView ?? 0;

        const applyZoomDelta = (delta: number) => { 
            if(cam?.fieldOfView) 
                cam.fieldOfView += delta; 
        };

        if(delta > 0 && zoom < this.zoomMax)
            applyZoomDelta(this.zoomDeltaBuffer);
        else if(delta < 0 && zoom > this.zoomMin)
            applyZoomDelta(this.zoomDeltaBuffer);
        else
            this.zoomDeltaBuffer = 0; // reset when out in a  bound
    }

    protected createPanorama(): THREE.Mesh {
        const sphere = new THREE.SphereGeometry(this.panoramaSize, 256, 256);

        const mat = this.optionalTransitionMaterial ?? this.defaultMaterial;
        mat.side = THREE.DoubleSide;

        const mesh = new THREE.Mesh(sphere, mat);

        mesh.position.set(0, 0, this.panoramaSize);
        mesh.scale.set(1, -1, 1);

        return mesh;
    }

    next() {
        this._i++;
        if (this._i >= this.media.length) {
            this._i = 0;
        }

        this.select(this._i);
    }

    previous() {
        this._i--;
        if (this._i < 0) {
            this._i = this.media.length - 1;
        }

        this.select(this._i);
    }

    select(index: number, forceNoTransition: boolean = false) {
        this._i = index;
        this.transitionStartTimeStamp = this.context.time.time;

        // enable transition if not forced or nothing was displayed before
        this.isTransitioning = true && !forceNoTransition && this.hasAppliedBefore;

        // compleate the transition instantly
        if (!this.isTransitioning)
            this.setTransition(1);

        this.apply();

        this.dispatchEvent(new Event("select"));
    }

    // @nonSerialized
    set videoPlayback(pause: boolean) {
        if(this.currentMedia?.info?.type === "video") {
            if(pause)
                this.videoPlayer.play();
            else
                this.videoPlayer.pause();
        }
    }
    // @nonSerialized
    get videoPlayback(): boolean { 
        return this.currentMedia?.info?.type === "video" && this.videoPlayer.isPlaying;
    }

    protected hasAppliedBefore: boolean = false;
    async apply() {
        const media = this.media[this.index];

        if(!media || !media.data) {
            console.error("invalid media", media);
            return;
        }

        this.previousMedia = this.currentMedia;
        this.currentMedia = media;
        
        this.hasAppliedBefore = true;
        this.hasLoadedMedia = false;

        // based on data type and info handle and apply texture to the material
        if(typeof media.data == "string") {
            if(media.info?.type === "image") {
                const img = ImageReference.getOrCreate(media.data);
                const texture = await img.createTexture();
                if (texture) {
                    texture.flipY = false;
                    if (this.optionalTransitionMaterial) { // custom shader
                        texture.colorSpace = THREE.LinearSRGBColorSpace;
                    }
                    else { // MeshBasicMaterial
                        texture.colorSpace = THREE.SRGBColorSpace;
                    }                   
                    
                    this.setTexture(texture);
                }
                else {
                    console.error(`PanoramaViewer: Failed to load image: ${media.data}`)
                }
            }
            else if (media.info?.type === "video") {
                this.videoPlayer.setClipURL(media.data);
                this.videoPlayer.isLooping = true; // TODO: add option
                this.videoPlayer.play(); // TODO: autoplay option
                // TODO: can hang on error
                // TODO: can cause two transitions to occur at once!
                while(!this.videoPlayer.isPlaying) {
                    await delay(0.1);
                }
                this.setTexture(this.videoPlayer.videoTexture);
            }
            else {
                console.warn(`PanoramaViewer: Unsupported media type: ${media.info?.type}`);
            }
        }
        else if (media.data instanceof Texture) {
            if (this.optionalTransitionMaterial) { // custom shader
                media.data.colorSpace = THREE.LinearSRGBColorSpace;
                /* texture.colorSpace = THREE.NoColorSpace; */
            }
            else { // MeshBasicMaterial
                media.data.colorSpace = THREE.SRGBColorSpace;
            }

            this.setTexture(media.data);
        }
        else {
            console.warn(`PanoramaViewer: Unsupported media type! ${typeof media.data}`, media.data)
        }

        this.hasLoadedMedia = true;
    }

    protected setTexture(texture: Texture | null) {
        if (!texture) return;

        if (this.optionalTransitionMaterial) {
            const mat = this.optionalTransitionMaterial;

            mat["_TextureA"] = mat["_TextureB"];
            mat["_TextureB"] = texture;
            
            mat["_StereoA"] = this.previousMedia?.info?.stereo === true;;
            mat["_StereoB"] =  this.currentMedia?.info?.stereo === true;
        }
        else {
            this.defaultMaterial.map = texture;

            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
        }
    }

    protected updateTextureTransition() {
        if (!this.isTransitioning) return;

        const time = this.context.time.time;
        const t = Mathf.clamp01((time - this.transitionStartTimeStamp) / this.transitionDuration);
        if (t > 0.5 && !this.hasLoadedMedia) {
            this.transitionStartTimeStamp = time - (this.transitionDuration * 0.5); // reset the transition time to start from the middle
        }

        this.setTransition(t);
        
        // on completed
        if (t >= 1.0) {
            this.isTransitioning = false;
            if(this.currentMedia?.info?.type !== "video") {
                if(this.videoPlayer.isPlaying)
                    this.videoPlayer.pause();
            }
        }
    }

    protected setTransition(transition: number) {
        if (!this.optionalTransitionMaterial) return;
        this.optionalTransitionMaterial["_T"] = transition;
    }

    // @nonSerialized
    isGyroEnabled = false;
    setGyroControls(enabled: boolean) {
        if (!this.optionalGyroControls) return;
        if (!this.optionalOrbitalControls) return;

        this.optionalGyroControls.enabled = enabled;
        this.optionalOrbitalControls.enabled = !enabled;
    }
    toggleGyroControls() {
        this.isGyroEnabled = !this.isGyroEnabled;
        this.setGyroControls(this.isGyroEnabled);
    }

    protected lastActivePointerStamp: number = Number.MIN_SAFE_INTEGER;
    protected updateAutoRotate() {
        if (!this.autoRotate) return;

        const input = this.context.input;
        const time = this.context.time.time;

        if (input.getPointerPressedCount() > 0)
            this.lastActivePointerStamp = time;

        if (time - this.lastActivePointerStamp > this.autoRotateTimeout) {
            if (this.optionalOrbitalControls) {
                this.optionalOrbitalControls.autoRotate = true;
            }
        }
    }
}