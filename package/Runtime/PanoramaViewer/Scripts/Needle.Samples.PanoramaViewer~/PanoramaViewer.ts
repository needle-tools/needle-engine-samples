import { Behaviour, ImageReference, Mathf, VideoPlayer, delay, serializable } from "@needle-tools/engine";
import * as THREE from "three";

/** Media definition */
export interface IPanoramaViewerMedia {
    data: string | THREE.Texture;
    info?: { 
        /* stereo?: boolean; */
        type?: string | "image" | "video";
    };
}

/** 
 * A PanoramaViewer component that can display images and videos in a 360 degree sphere.
 * Creates its own panorama sphere and parents it to itself
 * Supports local textures, remote texutres and videos
 * Use addImage and addVideo to add your media to the viewer
*/
export class PanoramaViewer extends Behaviour {

    start() {
        this.panoSphere = this.createPanorama();
        this.gameObject.add(this.panoSphere);

        this.select(0, true);
    }

    update(): void {
        this.applyFade();
    }


    /* ------ MEDIA ------ */

    // @nonSerialized
    media: IPanoramaViewerMedia[] = [];

    // @nonSerialized
    currentMedia?: IPanoramaViewerMedia;

    // @nonSerialized
    addImage(image: string | string[] | THREE.Texture | THREE.Texture[]) {
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


    /* ------ SELECTING ------ */

    private _index = -1;

    // @nonSerialized
    get index() {
        return Mathf.clamp(this._index, 0 , this.media.length - 1);
    }
    set index(value: number) {
        this.select(value);
    }
    
    async next() {
        await this.select(this._index + 1);
    }
    
    async previous() {
        await this.select(this._index - 1);
    }


    /* ------ LOADING ------ */

    private selectionId = 0;
    async select(index: number, immediate: boolean = false): Promise<boolean> {
        // sanitize and loop index
        if (index < 0) {
            index = this.media.length - 1;
        }
        index %= this.media.length;
        
        // no change required
        if (this._index === index) return false;

        // set index
        this._index = index;

        // unique id to abort the selection if overriden with another
        const id = ++this.selectionId;

        // get data
        const media = this.media[this._index];
        this.currentMedia = media;

        // raise event for e.g. ui
        this.dispatchEvent(new Event("select"));
        
        // fade out
        if (!immediate) this._targetFadeValue = 0;

        // load texture
        const texture = await this.getTexture(media);
        if (!texture) return false
        
        // wait for full fade out
        while(Math.abs(this._targetFadeValue - this._currentFadeValue) > .01) {
            if(id !== this.selectionId) return false; // if select was called while loading
            await delay(10);
        }

        // fade in
        this._targetFadeValue = 1

        // apply texture
        this.setTexture(texture);

        // auto play/stop video
        const mediaType = this.currentMedia?.info?.type;
        if (mediaType === "video") this.videoPlayer?.play();
        if (mediaType !== "video") this.videoPlayer?.stop();
        
        // wait for full fade in
        while(Math.abs(this._targetFadeValue - this._currentFadeValue) > .01) {
            if(id !== this.selectionId) return false; // if select was called while loading
            await delay(10);
        }

        return true;
    }

    private async getTexture(medium: IPanoramaViewerMedia): Promise<THREE.Texture | undefined> {
        if(!medium || !medium.data) {
            console.error("invalid media", medium);
            return;
        }
        
        let newTexture: THREE.Texture | undefined;

        // based on data type and info handle and apply texture to the material
        if(typeof medium.data == "string") {
            if(medium.info?.type === "image") {
                const img = ImageReference.getOrCreate(medium.data);
                const texture = await img.createTexture();
                if (texture) {
                    texture.flipY = false;
                    texture.colorSpace = THREE.SRGBColorSpace;
                    newTexture = texture;
                }
                else {
                    console.error(`PanoramaViewer: Failed to load image: ${medium.data}`)
                }
            }
            else if (medium.info?.type === "video") {
                this.videoPlayer.setClipURL(medium.data);
                this.videoPlayer.isLooping = true; // TODO: add option
                this.videoPlayer.play(); // TODO: autoplay option
                // TODO: can hang on error
                while(!this.videoPlayer.isPlaying) {
                    await delay(0.1);
                }
                newTexture = this.videoPlayer.videoTexture!;
            }
            else {
                console.warn(`PanoramaViewer: Unsupported media type: ${medium.info?.type}`);
            }
        }
        else if (medium.data instanceof THREE.Texture) {
            medium.data.colorSpace = THREE.SRGBColorSpace; // TODO: is this nessesery for existing textures?
            newTexture = medium.data;
        }
        else {
            console.warn(`PanoramaViewer: Unsupported media type! ${typeof medium.data}`, medium.data)
        }

        return newTexture;
    }

    private setTexture(texture: THREE.Texture) {
        this.panoMaterial.map = texture;
        this.panoMaterial.needsUpdate = true;
    }


    /* ------ TRANSITION ------ */

    @serializable()
    transitionDuration: number = 0.3;

    private blackColor = new THREE.Color(0x000000);
    private whiteColor = new THREE.Color(0xffffff);
    
    private _targetFadeValue: number = 0;
    private _currentFadeValue = 0;
    private applyFade() {
        const diff = this._targetFadeValue - this._currentFadeValue;
        const direction = diff > 0 ? 1 : -1;
        const step = direction * this.context.time.deltaTime / (this.transitionDuration / 2);
        this._currentFadeValue = Mathf.clamp01(this._currentFadeValue + step);
        if (Math.abs(diff) < step * 2) this._currentFadeValue = this._targetFadeValue;
        this.panoMaterial.color.copy(this.blackColor).lerp(this.whiteColor, this.easeInOutSine(this._currentFadeValue));
    }

    // sin in out
    private easeInOutSine(t: number) {
        return (1 - Math.cos(Math.PI * t)) / 2;
    }

    /* ------ VIDEO ------ */

    private _videoPlayer?: VideoPlayer;
    // @nonSerialized
    get videoPlayer(): VideoPlayer {
        this._videoPlayer ??= this.gameObject.getOrAddComponent(VideoPlayer)!;
        this._videoPlayer["renderMode"] = 2; //! RenderTexture;
        return this._videoPlayer;
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


    /* ------ PANORAMA MODEL ------ */

    //@nonSerialized
    panoramaSize = 100;

    private panoSphere?: THREE.Mesh;
    private panoMaterial = new THREE.MeshBasicMaterial();

    private createPanorama(): THREE.Mesh {
        const sphere = new THREE.SphereGeometry(this.panoramaSize, 256, 256);

        this.panoMaterial.side = THREE.DoubleSide;

        const mesh = new THREE.Mesh(sphere, this.panoMaterial);

        mesh.position.set(0, 0, 0);
        mesh.scale.set(1, -1, 1);

        return mesh;
    }
}
