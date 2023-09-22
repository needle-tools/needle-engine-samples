import { Behaviour, Image, MeshRenderer, VideoPlayer, WaitForSeconds, serializable } from "@needle-tools/engine";
import { Texture, DataTexture, Vector2, MeshBasicMaterial } from "three";
import * as THREE from "three";

export class SampleVideo extends Behaviour {

    fps: number = 1;

    @serializable(VideoPlayer)
    video!: VideoPlayer;
    
    @serializable(MeshRenderer)
    previewMesh!: MeshRenderer;
    
    @serializable(Texture)
    exampleTexture!: Texture;
    
    private samples: Texture[] = [];

    start(): void {
        this.startCoroutine(this.generateTextures(this.fps, (i, tex) => {
            this.samples.push(tex);
        }));

        setTimeout(() => { this.startCoroutine(this.preview());  }, 1000);
    }

    private previewIndex: number = 0;
    private *preview() {
        while(true) {
            if(this.samples.length !== 0) {
                console.log(`Set preview ${this.previewIndex + 1}/${this.samples.length}, TIME: ${1/this.fps * this.previewIndex}`);
                const mat = this.previewMesh.sharedMaterial as MeshBasicMaterial
                mat.map = this.samples[this.previewIndex];
                mat.needsUpdate = true;

                if(++this.previewIndex >= this.samples.length)
                    this.previewIndex = 0;
            }
            yield WaitForSeconds(1 / this.fps);
        }
    }

    private *generateTextures(fps: number, onSample:(frame: number, tex: Texture) => void)  {
        console.log("===== GENERATING TEXTURES =====");

        if(!this.video.isPlaying) {
            this.video.playbackSpeed = 0;
            this.video.play();
            console.log("Starting video");
        }

        const video = this.video.videoElement!;

        console.log("Waiting for metadata... ");
        // wait for metadata to load
        while(true) {
            if(video.HAVE_CURRENT_DATA && video.duration)
                break;
            else
                yield;
        }
        console.log("... HAVE METADATA", video.duration);

        
        // loop through video frames
        const steps = Math.floor(video.duration * fps);
        for (let i = 0; i < steps; i++) {
            
            // set video time
            this.video.currentTime = (1 / fps) * i;
            console.log(`Frame: ${i + 1} / ${steps}, Time: ${video.currentTime} / ${video.duration}`);

            // wait for data and then sample
            while(true) {
                if(video.HAVE_CURRENT_DATA) {
                    yield this.sample(this.video, (tex) => onSample(i, tex));
                    break;
                }
                else
                    yield;
            }
        }

        // cleanup
        if(this.canvas) {
            this.canvas.remove();
            this.canvas = undefined;
        }
    }

    private canvas?: HTMLCanvasElement;

    private *sample(player: VideoPlayer, result: (tex: Texture) => void) {

        const renderer = this.context.renderer;
        const src = player.videoTexture!;
        const video = player.videoElement!;

        if(!this.canvas) {
            this.canvas = document.createElement('canvas')!;
            this.context.domElement.appendChild(this.canvas);
            this.canvas.style.display = "none"; //hide

            this.canvas.width = video.videoWidth;
            this.canvas.height = video.videoWidth;
            yield;
        }
        const canvas = this.canvas!;
        const context = canvas.getContext('2d', { colorSpace: "srgb" })!;

        context.clearRect(0, 0, canvas.width, canvas.height);
        yield;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)!;

        const dst = new Texture(imageData);
        dst.colorSpace = src.colorSpace;
        dst.wrapT = THREE.RepeatWrapping;
        dst.repeat.y = -1;
        dst.needsUpdate = true;
        result(dst);
    }
}