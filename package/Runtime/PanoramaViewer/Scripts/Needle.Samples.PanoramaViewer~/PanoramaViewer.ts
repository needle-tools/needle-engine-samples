import { Behaviour, ImageReference, Mathf, OrbitControls, PointerType, VideoPlayer, findObjectOfType, serializable } from "@needle-tools/engine";
import { Texture, Material } from "three";
import * as THREE from "three";
import { GyroscopeControls } from "samples.sensors";

export interface IPanoramaViewerMedia {
    data: string | Texture;
    info?: { 
        stereo?: boolean;
        type?: string | "image" | "video";
    };
}

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

    @serializable(Material)
    optionalTransitionMaterial?: Material

    protected defaultMaterial = new THREE.MeshBasicMaterial();

    protected index = 0;
    private get _i() {
        return Mathf.clamp(this.index, 0 , this.media.length - 1);
    }
    protected panoSphere?: THREE.Mesh;
    protected panoMaterial?: Material;

    protected optionalGyroControls?: GyroscopeControls;
    protected optionalOrbitalControls?: OrbitControls;

    protected _videoPlayer?: VideoPlayer;
    protected get videoPlayer(): VideoPlayer {
        this._videoPlayer ??= this.gameObject.addNewComponent(VideoPlayer)!;
        return this._videoPlayer;
    }

    start() {
        this.panoSphere = this.createPanorama();
        this.gameObject.add(this.panoSphere);

        // TODO report: Can't use serialized reference or GetComponentInChildren? Results in a { guid } obj.
        this.optionalGyroControls = findObjectOfType(GyroscopeControls, this.context.scene, false);
        this.optionalOrbitalControls = findObjectOfType(OrbitControls, this.context.scene, false);

        this.apply();
    }

    update(): void {
        if (this.enableZoom)
            this.handleZoom();

        this.updateTextureTransition();
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
        const sphere = new THREE.SphereGeometry(this.panoramaSize, 128, 128);

        const mat = this.optionalTransitionMaterial ?? this.defaultMaterial;
        mat.side = THREE.DoubleSide;

        const mesh = new THREE.Mesh(sphere, mat);

        mesh.position.set(0, 0, this.panoramaSize);
        mesh.scale.set(1, -1, 1);

        return mesh;
    }

    next() {
        this.index++;
        if (this.index >= this.media.length) {
            this.index = 0;
        }

        this.apply();
    }

    previous() {
        this.index--;
        if (this.index < 0) {
            this.index = this.media.length - 1;
        }

        this.apply();
    }

    select(index: number) {
        this.index = index;
        this.apply();
    }

    async apply() {
        if (!this.panoSphere) return;

        const media = this.media[this._i];

        if(!media || !media.data)
            return;

        // stop any video before apply
        this.videoPlayer.stop();

        this.hasLoadedMedia = false;

        // based on data type and info handle and apply texture to the material
        if(typeof media.data == "string") {
            if(media.info?.type === "image") {
                const img = ImageReference.getOrCreate(media.data);
                const texture = await img.createTexture();
                if (texture) {
                    texture.encoding = THREE.sRGBEncoding;
                    texture.repeat = new THREE.Vector2(1, -1);
                    texture.wrapT = THREE.RepeatWrapping;
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
                this.setTexture(this.videoPlayer.videoTexture);
            }
            else {
                console.warn(`PanoramaViewer: Unsupported media type: ${media.info?.type}`);
            }
        }
        else if (media.data instanceof Texture) {
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
        }
        else {
            this.defaultMaterial.map = texture;
        }
    }

    @serializable()
    transitionDuration: number = 0.3;

    protected transitionStartTimeStamp: number = Number.MAX_SAFE_INTEGER;
    protected hasLoadedMedia: boolean = true;
    protected updateTextureTransition() {
        if (this.optionalTransitionMaterial) {
            const time = this.context.time.time;
            const t = Mathf.clamp01((time - this.transitionStartTimeStamp) / this.transitionDuration);
            if (t > 0.5 && !this.hasLoadedMedia) {
                this.transitionStartTimeStamp = time - (this.transitionDuration * 0.5); // reset the transition time to start from the middle
            }

            // TODO: when t >= 1.0, stop calling this method
            this.optionalTransitionMaterial["_T"] = t;
        }
    }

    private isGyroEnabled = false;
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
}


