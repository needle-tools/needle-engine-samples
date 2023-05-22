import { Behaviour, FrameEvent, GameObject, Renderer, VideoPlayer, serializable } from "@needle-tools/engine";
import { debug } from "@needle-tools/engine/lib/engine-components/ReflectionProbe";
import { Material, MeshStandardMaterial, ShaderMaterial, Texture, VideoTexture } from "three";

export class CombinedVideo extends Behaviour {

    @serializable(VideoPlayer)
    player?: VideoPlayer;

    @serializable(Renderer)
    renderer?: Renderer;

    start(): void {

        if(this.player == null || this.renderer == null)
            return;
            
        this.renderer.sharedMaterial["_VideoTex"] = this.player.videoTexture;
    }

/*
    @serializable(VideoPlayer)
    colorPlayer?: VideoPlayer;

    @serializable(Renderer)
    colorRenderer?: Renderer;

     @serializable(VideoPlayer)
    maskPlayer?: VideoPlayer;

    @serializable(Renderer)
    maskRenderer?: Renderer;

    @serializable(Renderer)
    combinedRenderer?: Renderer;

    @serializable(VideoPlayer)
    referencePlayer?: VideoPlayer;

    private readyVideos: number = 0;
    private readonly expectedVideos = 3;

    startVideos(): void {
        this.startVideo(this.colorPlayer!);
        this.startVideo(this.maskPlayer!);
        this.startVideo(this.referencePlayer!);
    }

    // play video, hook to the OnCanPlay event and pause the video if it's not the last one
    startVideo(player: VideoPlayer) {

        if(player === null)
            return;

        player.play();

        if(player.videoElement == null)
            console.error(`Can't play video at ${this.gameObject.name} (Video element is null)`);
        else
            player.videoElement.oncanplay = () => this.handleVideoReady(player);
    }

    handleVideoReady(player: VideoPlayer) {

        // Increase the global ready count and pause if first, play if last
        this.readyVideos++;
        if(this.readyVideos < this.expectedVideos)
            player.pause();
        else if (this.readyVideos === this.expectedVideos)
            this.setupCombinedVideo();
    }

    setupCombinedVideo() {

        this.setupPlayer(this.maskPlayer!);
        this.setupPlayer(this.colorPlayer!);
        this.setupPlayer(this.referencePlayer!);

        if(this.combinedRenderer == null || this.colorRenderer == null || this.maskRenderer == null)
            return;

        // fetch video textures and set them to combined video material
        this.combinedRenderer.sharedMaterial["_ColorMap"] = this.colorRenderer.sharedMaterial["map"];
        this.combinedRenderer.sharedMaterial["_MaskMap"]  = this.maskRenderer.sharedMaterial["map"];
    }

    setupPlayer(player: VideoPlayer) {

        if(player == null)
            return;
            
        player.playInBackground = true;
        player.currentTime = 0;
        player.play();
    } */

}