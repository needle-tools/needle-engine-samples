import { Behaviour, Renderer, VideoPlayer, serializable } from "@needle-tools/engine";

export class CombinedVideo extends Behaviour {

    @serializable(VideoPlayer)
    player?: VideoPlayer;

    @serializable(Renderer)
    renderer?: Renderer;

    start(): void {

        const vidTexture = this.player?.videoTexture;
        if(vidTexture == null || this.renderer == null)
            return;
            
        this.renderer.sharedMaterial["_VideoTex"] = vidTexture;
    }
}