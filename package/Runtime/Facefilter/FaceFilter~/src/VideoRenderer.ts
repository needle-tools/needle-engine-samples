import { Context, ObjectUtils } from "@needle-tools/engine";
import { type NeedleFilterTrackingManager } from "./FaceFilter.js";
import { CanvasTexture, IUniform, MeshBasicMaterial, Object3D, PerspectiveCamera, ShaderMaterial, Texture, Vector3, VideoTexture, WebGLRenderTarget } from "three";
import { mirror } from "./settings.js";
import { MPMask } from "@mediapipe/tasks-vision";



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

const tasksCanvas = document.createElement("canvas");
const createShaderProgram = (gl: WebGL2RenderingContext) => {
    const vs = `
      attribute vec2 position;
      varying vec2 texCoords;
    
      void main() {
        texCoords = (position + 1.0) / 2.0;
        texCoords.y = 1.0 - texCoords.y;
        gl_Position = vec4(position, 0, 1.0);
      }
    `

    const fs = `
      precision highp float;
      varying vec2 texCoords;
      uniform sampler2D textureSampler;
      void main() {
        float a = texture2D(textureSampler, texCoords).r;
        gl_FragColor = vec4(a,a,a,a);
      }
    `
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    if (!vertexShader) {
        throw Error('can not create vertex shader')
    }
    gl.shaderSource(vertexShader, vs)
    gl.compileShader(vertexShader)

    // Create our fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    if (!fragmentShader) {
        throw Error('can not create fragment shader')
    }
    gl.shaderSource(fragmentShader, fs)
    gl.compileShader(fragmentShader)

    // Create our program
    const program = gl.createProgram()
    if (!program) {
        throw Error('can not create program')
    }
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    return {
        vertexShader,
        fragmentShader,
        shaderProgram: program,
        attribLocations: {
            position: gl.getAttribLocation(program, 'position')
        },
        uniformLocations: {
            textureSampler: gl.getUniformLocation(program, 'textureSampler')
        }
    }
}
const createVertexBuffer = (gl: WebGL2RenderingContext) => {
    if (!gl) {
        return null
    }
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]),
        gl.STATIC_DRAW
    )
    return vertexBuffer
}

function createCopyTextureToCanvas(
    canvas: HTMLCanvasElement | OffscreenCanvas
) {
    const gl = canvas.getContext('webgl2')
    if (!gl) {
        return undefined
    }
    const {
        shaderProgram,
        attribLocations: { position: positionLocation },
        uniformLocations: { textureSampler: textureLocation }
    } = createShaderProgram(gl)
    const vertexBuffer = createVertexBuffer(gl)

    return (mask: MPMask) => {
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(1.0, 1.0, 1.0, 1.0)
        gl.useProgram(shaderProgram)
        gl.clear(gl.COLOR_BUFFER_BIT)
        const texture = mask.getAsWebGLTexture()
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(positionLocation)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.uniform1i(textureLocation, 0)

        gl.drawArrays(gl.TRIANGLES, 0, 6)

        return createImageBitmap(canvas)
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
    }

    disable() {
        this._videoQuad?.removeFromParent();
    }

    private _texture: Texture | null = null;
    private _downloaded = false;
    private _maskCanvas: HTMLCanvasElement | null = null;
    private _maskCanvasContext: ImageBitmapRenderingContext | null = null;
    private toImageBitmap: ((mask: MPMask) => Promise<ImageBitmap>) | undefined;

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
                // if (this.context.time.frameCount % 20 == 0)
                //     console.log(this.owner.lastImageSegmentationResults);

                const mask = this.owner.lastImageSegmentationResults.confidenceMasks?.[0] as MPMask;
                // const mask = this.owner.poselandmarkerResult.segmentationMasks?.[0];
                // if (mask?.canvas && this.owner.poselandmarkerResult.landmarks.length >= 1) {
                if (mask) {

                    if (!this._maskCanvas) {
                        // this.toImageBitmap = createCopyTextureToCanvas(this.context.renderer.domElement)

                        // console.log(this.owner.poselandmarkerResult, this.owner.poselandmarkerResult.landmarks)
                        this._maskCanvas = document.createElement("canvas");
                        this._maskCanvas.style.cssText = `
                            position: absolute; z-index: 999; width: 300px; height: 300px; top: 0; left: 0; 
                        `
                        // this._maskCanvasContext = this._maskCanvas.getContext("bitmaprenderer")!;
                        this.context.domElement.appendChild(this._maskCanvas);


                        // red
                        const ctx = this._maskCanvas.getContext("2d")!;
                        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
                        ctx.fillRect(0, 0, mask.width, mask.height);
                        // this._maskCanvas.width = mask.canvas.width;
                        // this._maskCanvas.height = mask.canvas.height;
                    }

                    // this.toImageBitmap!(mask).then(res => {
                    //     console.log(res);
                    //     // this.context.renderer.getContext()!.drawImage(
                    //     //     maskImage,
                    //     //     0,
                    //     //     0,
                    //     //     video.videoWidth,
                    //     //     video.videoHeight
                    //     // )
                    // })

                    if (mask.canvas instanceof OffscreenCanvas) {

                        const img = mask.canvas.getContext("webgl2");

                        // if (this.context.time.frame % 30 === 0) 
                            {
                            const prop = this.context.renderer.properties.get(this._material);
                            console.log(prop);
                            const cur = prop.currentProgram as { program: WebGLProgram };
                            const gl = this.context.renderer.getContext() as WebGL2RenderingContext;

                            gl.useProgram(cur.program);
                            const maskLocation = gl.getUniformLocation(cur.program, 'map');
                            console.log(maskLocation);
                            gl.activeTexture(gl.TEXTURE0);
                            gl.bindTexture(gl.TEXTURE_2D, mask.getAsWebGLTexture());
                            gl.uniform1i(maskLocation, 0);
                            gl.drawArrays(gl.TRIANGLES, 0, 6);
                            gl.bindTexture(gl.TEXTURE_2D, null);
                            // console.log(img);
                            // this.context.renderer.copyFramebufferToTexture
                            // const texture = mask.getAsWebGLTexture();

                            // const gl = this.context.renderer.getContext();

                            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask.canvas);

                            // const fb = gl.createFramebuffer();
                            // gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
                            // const attachmentPoint = gl.COLOR_ATTACHMENT0;
                            // const textureType = gl.TEXTURE_2D;
                            // gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, textureType, texture, 0);
                            // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                            // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

                            // const bitmap = mask.canvas.transferToImageBitmap();
                            // const ctx = this._maskCanvas.getContext("2d")!;
                            // console.log(ctx);
                            // ctx!.drawImage(bitmap, 0, 0);
                            // const arr = mask.getAsUint8Array();
                            // console.log(arr);
                            // // download
                            // const blob = new Blob([arr], { type: "image/png" });
                            // const url = URL.createObjectURL(blob);
                            // const a = document.createElement("a");
                            // a.href = url;
                            // a.download = "mask.png";
                            // a.click();
                        }

                        // console.log(arr);
                        // // mask.get
                        // const bm = mask.canvas.transferToImageBitmap();
                        // console.log(bm);
                        // this._maskCanvasContext!.transferFromImageBitmap(bm);
                    }

                    // draw offscreen canvas into mask canvas
                    // this._maskCanvasContext!.clearRect(0, 0, mask.width, mask.height);
                    // this._maskCanvasContext!.drawImage(mask.canvas, 0, 0);


                    // if (this._maskCanvas.width !== mask.canvas.width || this._maskCanvas.height !== mask.canvas.height) {
                    //     this._maskCanvas.width = mask.canvas.width;
                    //     this._maskCanvas.height = mask.canvas.height;
                    // }
                    // this._maskCanvasContext!.drawImage(mask.canvas, 0, 0);
                    // this.context.domElement.appendChild(this._maskCanvas);



                    // this._texture ??= new Texture(mask.canvas);
                    // this._texture.needsUpdate = true;
                    // this._material.uniforms.map.value = this._texture;

                    // if (this._texture) {
                    //     const texProps = this.context.renderer.properties.get(this._texture);
                    //     // console.log(texProps);
                    //     texProps.__webglTexture = mask.getAsWebGLTexture();
                    //     this._texture.needsUpdate = true;
                    //     // console.log(texProps.__webglTexture)
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
