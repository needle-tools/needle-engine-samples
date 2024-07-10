import { Behaviour, ImageReference, Mathf, VideoPlayer, delay, removePatch, serializable } from "@needle-tools/engine";
import { Texture, Material } from "three";
import * as THREE from "three";

/** Media definition */
export interface IPanoramaViewerMedia {
    data: string | Texture;
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


    /* ------ MEDIA ------ */

    // @nonSerialized
    media: IPanoramaViewerMedia[] = [];

    protected previousMedia?: IPanoramaViewerMedia;
    // @nonSerialized
    currentMedia?: IPanoramaViewerMedia;

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


    /* ------ SELECTING ------ */

    protected _index = 0;
    // @nonSerialized
    get index() {
        return Mathf.clamp(this._index, 0 , this.media.length - 1);
    }
    
    next() {
        this._index++;
        this._index %= this.media.length;
        this.select(this._index);
    }
    
    previous() {
        this._index--;
        if (this._index < 0) this._index = this.media.length - 1;
        this.select(this._index);
    }


    /* ------ LOADING ------ */

    protected hasLoadedMedia: boolean = true;
    protected isFading: boolean = false;
    select(index: number, forceNoTransition: boolean = false) {
        this._index = index;
        const medium = this.media[this.index];
        const isFirstSelect = this.previousMedia === undefined;

        this.previousMedia = this.currentMedia ?? medium;
        this.currentMedia = medium;

        if (!this.isFading) {
            this.isFading = true;
            this.startCoroutine(this.beginTransition(medium, isFirstSelect || forceNoTransition, () => {
                this.isFading = false;
                if (this.currentMedia !== medium) {
                    this.select(this._index);
                }
            }));
        }

        this.dispatchEvent(new Event("select"));
    }

    //protected hasAppliedBefore: boolean = false;
    async getTexture(medium: IPanoramaViewerMedia): Promise<Texture | undefined> {
        if(!medium || !medium.data) {
            console.error("invalid media", medium);
            return;
        }
        
        let newTexture: Texture | undefined;

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
        else if (medium.data instanceof Texture) {
            medium.data.colorSpace = THREE.SRGBColorSpace; // TODO: is this nessesery for existing textures?
            newTexture = medium.data;
        }
        else {
            console.warn(`PanoramaViewer: Unsupported media type! ${typeof medium.data}`, medium.data)
        }

        return newTexture;
    }


    /* ------ TRANSITION ------ */

    @serializable()
    transitionDuration: number = 0.3;

    @serializable()
    fadePoint: number = 0.25;


    // @header Optional transition material
    /* @serializable(Material)
    optionalTransitionMaterial?: Material */

    protected transitionStartTimeStamp: number = Number.MAX_SAFE_INTEGER;
    
    protected isTransitioning: boolean = false;

    protected blackColor = new THREE.Color(0x000000);
    protected whiteColor = new THREE.Color(0xffffff);
    protected *beginTransition(medium: IPanoramaViewerMedia, skipFade: boolean = false, onComplete?: () => void) {
        // start loading new texture
        let newTexture: Texture | null | undefined;
        this.getTexture(medium).then(texture => {
            newTexture = texture ?? null;
        });

        
        // fade out to black
        const fadeOutStamp = this.context.time.time;
        const fadeOutDuration = this.transitionDuration * this.fadePoint;
        while(true && !skipFade) {
            let t = Mathf.clamp01((this.context.time.time - fadeOutStamp) / fadeOutDuration);
            this.panoMaterial.color.lerp(this.blackColor, t);
            this.panoMaterial.needsUpdate = true;
            if (t >= 1 - Mathf.Epsilon)
                break;
            else
                yield;
        }

        // await texture if not loaded already
        while(newTexture === undefined) {
            yield;
        }

        // set texture
        if (newTexture !== null) {
            this.panoMaterial.map = newTexture;
            this.panoMaterial.needsUpdate = true;
        }

        // auto play/stop video
        const mediaType = this.currentMedia?.info?.type;
        if (mediaType === "video") this.videoPlayer?.play();
        if (mediaType !== "video") this.videoPlayer?.stop();

        // fade in to "white"
        const fadeInStamp = this.context.time.time;
        const fadeInDuration = this.transitionDuration - (this.transitionDuration * this.fadePoint);
        while(true && !skipFade) {
            const t = Mathf.clamp01((this.context.time.time - fadeInStamp) / fadeInDuration);
            this.panoMaterial.color.lerp(this.whiteColor, t);
            this.panoMaterial.needsUpdate = true;
            if (t >= 1 - Mathf.Epsilon)
                break;
            else
                yield;
        }

        // done
        onComplete?.();
    }


    /* ------ VIDEO ------ */

    protected _videoPlayer?: VideoPlayer;
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

    protected panoSphere?: THREE.Mesh;
    protected panoMaterial = new THREE.MeshBasicMaterial();

    protected createPanorama(): THREE.Mesh {
        const sphere = new THREE.SphereGeometry(this.panoramaSize, 256, 256);

        this.panoMaterial.side = THREE.DoubleSide;

        const mesh = new THREE.Mesh(sphere, this.panoMaterial);

        mesh.position.set(0, 0, 0);
        mesh.scale.set(1, -1, 1);

        return mesh;
    }
}
