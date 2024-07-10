import { serializable } from "@needle-tools/engine";
import { Texture } from "three";
import { PanoramaViewer } from "./PanoramaViewer";

export class PanoramaViewerSample extends PanoramaViewer {
    @serializable(Texture)
    textures: Texture[] = [];

    @serializable()
    textureURLs: string[] = [];

    @serializable()
    videosUrls: string[] = [];

    start() {
        // example of how to add an image from three.js Texture
        this.addImage(this.textures);

        // example of how to add an image from URL
        this.addImage(this.textureURLs);

        // example of how to add a video from URL
        this.addVideo(this.videosUrls);

        super.start();
    }
}
