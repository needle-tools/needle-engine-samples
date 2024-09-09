import { Context, ObjectUtils } from "@needle-tools/engine";
import { type NeedleFilterTrackingManager } from "./FaceFilter.js";
import { CanvasTexture, IUniform, MeshBasicMaterial, Object3D, PerspectiveCamera, ShaderMaterial, Texture, Vector3, VideoTexture, WebGLRenderTarget } from "three";
import { mirror } from "./settings.js";



class CustomVideoMaterial extends ShaderMaterial {
    constructor() {
        super({
            vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
            fragmentShader: `
        uniform sampler2D map;
        varying vec2 vUv;
        void main() {
            gl_FragColor = texture2D(map, vUv);
        }
        `,
            uniforms: {
                map: { value: null },
                segmentationMask: { value: null },
            }
        })
    }

}


export class VideoRenderer {
    readonly context: Context;
    readonly owner: NeedleFilterTrackingManager;

    constructor(owner: NeedleFilterTrackingManager) {
        this.context = owner.context
        this.owner = owner;
    }

    private _videoTexture: VideoTexture | null = null;
    private _videoQuad: Object3D | null = null;
    private _material!: CustomVideoMaterial;
    private _canvasTexture?: CanvasTexture;

    enable() {
        this._videoTexture ??= new VideoTexture(this.owner.video);
        this._material ??= new CustomVideoMaterial();
        this._material.uniforms.map.value = this._videoTexture;
        this._material.depthTest = false;
        this._material.depthWrite = false;
        this._videoQuad ??= ObjectUtils.createPrimitive("Quad", {
            rotation: new Vector3(Math.PI, Math.PI, 0),
            material: this._material
        });
        this._videoQuad.name = "Video Quad (Face Filter)";
    }

    disable() {
        this._videoQuad?.removeFromParent();
    }

    private _texture: Texture | null = null;
    private _downloaded = false;
    private _maskCanvas: HTMLCanvasElement | null = null;
    private _maskCanvasContext: CanvasRenderingContext2D | null = null;

    onUpdate() {

        if (this._videoTexture && this._videoQuad && this.context.mainCamera instanceof PerspectiveCamera) {
            if (this._videoQuad.parent !== this.context.mainCamera) {
                this.context.mainCamera.add(this._videoQuad);
            }

            const far = this.context.mainCamera.far;
            this._videoQuad.renderOrder = -1000;
            this._videoQuad.position.z = -far + .01;
            this._videoTexture.colorSpace = this.context.renderer.outputColorSpace;

            if (this.owner.lastImageSegmentationResults) {
                const mask = this.owner.lastImageSegmentationResults.confidenceMasks?.[0]?.canvas;
                console.log(this.owner.lastImageSegmentationResults)
                // const mask = this.owner.poselandmarkerResult.segmentationMasks?.[0];
                // if (mask?.canvas && this.owner.poselandmarkerResult.landmarks.length >= 1) {
                if (mask) {
                    
                    // if (!this._maskCanvas) {
                    //     // console.log(this.owner.poselandmarkerResult, this.owner.poselandmarkerResult.landmarks)
                    //     this._maskCanvas = document.createElement("canvas");
                    //     this._maskCanvasContext = this._maskCanvas.getContext("2d")!;
                    //     this._maskCanvas.width = mask.canvas.width;
                    //     this._maskCanvas.height = mask.canvas.height;

                    //     if (mask.canvas instanceof OffscreenCanvas) {
                    //         mask.canvas.convertToBlob().then(blob => {
                    //             const url = URL.createObjectURL(blob);
                    //             const a = document.createElement("a");
                    //             a.href = url;
                    //             a.download = "mask.png";
                    //             a.click();
                    //         });
                    //     }

                    //     // Draw the mask onto the temporary canvas
                    //     this._maskCanvasContext.drawImage(mask.canvas, 0, 0);
                    //     // Convert the canvas to a data URL
                    //     const dataURL = this._maskCanvas.toDataURL('image/png');

                    //     // Create a link element and trigger the download
                    //     const downloadLink = document.createElement('a');
                    //     downloadLink.href = dataURL;
                    //     downloadLink.download = 'segmentation_mask.png';
                    //     document.body.appendChild(downloadLink);
                    //     downloadLink.click();
                    // }

                    // if (this._maskCanvas.width !== mask.canvas.width || this._maskCanvas.height !== mask.canvas.height) {
                    //     this._maskCanvas.width = mask.canvas.width;
                    //     this._maskCanvas.height = mask.canvas.height;
                    // }
                    // this._maskCanvasContext!.drawImage(mask.canvas, 0, 0);
                    // this.context.domElement.appendChild(this._maskCanvas);

                    this._texture ??= new Texture(mask);
                    this._texture.needsUpdate = true;
                    this._material.uniforms.map.value = this._texture;

                    // if (this._texture) {
                    //     const texProps = this.context.renderer.properties.get(this._texture);
                    //     console.log(texProps);
                    //     texProps.__webglTexture = mask.getAsWebGLTexture();
                    //     this._texture.needsUpdate = true;
                    //     console.log(texProps.__webglTexture)
                    //     this._material.uniforms.map.value = this._texture;
                    // }

                    // const rt = new WebGLRenderTarget()

                    // const texture = new Texture();
                    // const gl = this.context.renderer.getContext();
                    // console.log(texture);
                    // this._maskCanvas ??= document.createElement("canvas");
                    // this._maskCanvas.width = mask.width;
                    // this._maskCanvas.height = mask.height;
                    // this._maskCanvasContext ??= this._maskCanvas.getContext("2d")!;

                    // this._canvasTexture ??= new CanvasTexture(mask.canvas);
                    // this._material.uniforms.map.value = this._canvasTexture;
                    // this._canvasTexture.needsUpdate = true;
                    // this._material.needsUpdate = true;
                    // this._material.uniformsNeedUpdate = true;

                }
            }

            let aspect = this.owner.video.videoWidth / this.owner.video.videoHeight;
            if (!mirror) {
                aspect *= -1;
            }
            this._videoQuad.scale
                .set(aspect, -1, 1)
                .multiplyScalar(far * Math.tan(this.context.mainCamera.fov * Math.PI / 180 / 2) * 2);
        }
    }

}
