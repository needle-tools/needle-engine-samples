import { Behaviour, ImageReference, Mathf, VideoPlayer, delay, serializable } from "@needle-tools/engine";
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

// TODO: consult texture encoding sets
// TODO: consult why the material can't be just assigned and needs to be a apart of the scene
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

        this.select(0);
    }

    update(): void {
        this.updateTextureTransition();
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
    
    async select(index: number, forceNoTransition: boolean = false) {
        this._index = index;
        this.transitionStartTimeStamp = this.context.time.time;

        // enable transition if not forced or nothing was displayed before
        this.isTransitioning = !forceNoTransition && this.hasAppliedBefore;

        await this.apply();

        // complete the transition instantly
        if (!this.isTransitioning) {
            this.setTransition(1);
        }

        this.dispatchEvent(new Event("select"));
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

        // Set the last END tex as the START tex
        this.swapTextures();

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
                    
                    this.newTexture = texture;
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
                this.newTexture = this.videoPlayer.videoTexture!;
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

            this.newTexture = media.data;
        }
        else {
            console.warn(`PanoramaViewer: Unsupported media type! ${typeof media.data}`, media.data)
        }

        if (this.newTexture)
            this.setTexture(this.newTexture);

        this.hasLoadedMedia = true;
    }


    /* ------ TRANSITION ------ */

    @serializable()
    transitionDuration: number = 0.3;

    // @header Optional transition material
    @serializable(Material)
    optionalTransitionMaterial?: Material

    protected transitionStartTimeStamp: number = Number.MAX_SAFE_INTEGER;
    
    // @nonSerialized
    isTransitioning: boolean = false;

    protected newTexture: Texture | undefined;
    protected swapTextures() {
        if (this.optionalTransitionMaterial) {
            const mat = this.optionalTransitionMaterial;
            mat["_TextureA"] = mat["_TextureB"];
        }
    }
    protected setTexture(newTexture: Texture) {
        if (this.optionalTransitionMaterial) {
            this.optionalTransitionMaterial["_TextureB"] = newTexture;
        }
        else {
            this.defaultMaterial.map = newTexture;
            newTexture.wrapS = THREE.RepeatWrapping;
            newTexture.wrapT = THREE.RepeatWrapping;
        }
    }

    private fadePoint: number = 0.25;
    protected updateTextureTransition() {
        if (!this.isTransitioning) return;

        const time = this.context.time.time;
        const t = Mathf.clamp01((time - this.transitionStartTimeStamp) / this.transitionDuration);
        if (t > this.fadePoint && !this.hasLoadedMedia) {
            this.transitionStartTimeStamp = time - (this.transitionDuration * this.fadePoint); // reset the transition time to start from the middle
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
    protected panoMaterial?: Material;

    protected defaultMaterial = new THREE.MeshBasicMaterial();

    protected createPanorama(): THREE.Mesh {
        const sphere = new THREE.SphereGeometry(this.panoramaSize, 256, 256);

        const mat = this.optionalTransitionMaterial ?? this.defaultMaterial;
        mat.side = THREE.DoubleSide;

        const mesh = new THREE.Mesh(sphere, mat);

        mesh.position.set(0, 0, 0);
        mesh.scale.set(1, -1, 1);

        return mesh;
    }
}
