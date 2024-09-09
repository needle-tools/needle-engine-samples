import { serializable, NEEDLE_progressive, Application } from "@needle-tools/engine";
import { Texture, Mesh, Matrix4, MeshBasicMaterial, Vector3, Material, VideoTexture, ShaderMaterial } from "three";
import { FilterBehaviour } from "../Behaviours.js";
import { NeedleFilterTrackingManager } from "../FaceFilter.js";
import { FaceGeometry, FaceLayout } from "./utils.facemesh.js";

export abstract class FaceMeshBehaviour extends FilterBehaviour {


    protected createMesh() {
        const mat = this.createMaterial();
        if (mat) {
            NEEDLE_progressive.assignTextureLOD(mat, 0);
            this.setupTextureProperties(mat);
            const geom = FaceGeometry.create(this.layout);
            this._mesh = new Mesh(geom, mat);
            this._geo = geom;
        }
        else {
            console.warn("Failed to create material (" + this.name + ")");
        }
    }

    protected abstract createMaterial(): Material | null;
    protected get layout(): FaceLayout { return "canonical"; }

    protected setupTextureProperties(mat: Material) {
        const key = Object.keys(mat);
        for (const k of key) {
            const value = mat[k];
            // Set all textures to the right colorspace
            if (value && (typeof value === "object") && value.isTexture) {
                value.colorSpace = this.context.renderer.outputColorSpace;
            }
        }
    }


    // internal state
    private _mesh: Mesh | null = null;
    private _geo: FaceGeometry | null = null;
    private _baseTransform: Matrix4 = new Matrix4();
    private _lastVideoWidth = 0;
    private _lastVideoHeight = 0;
    private _lastDomWidth = 0;
    private _lastDomHeight = 0;
    private _needsMatrixUpdate = false;

    /** @internal */
    onEnable(): void {
        if (!this._mesh) this.createMesh();
        this._lastDomWidth = 0;
        this._lastDomHeight = 0;
    }
    /** @internal */
    onDisable(): void {
        this._mesh?.removeFromParent();
    }

    /** @internal */
    onResultsUpdated(filter: NeedleFilterTrackingManager): void {
        const lm = filter.facelandmarkerResult?.faceLandmarks;
        if (lm && lm.length > 0) {
            const face = lm[0];
            if (this._mesh) {

                // frame delay the matrix update since otherwise e.g. opening the dev tools on chrome (f12) will not be picked up
                // and the aspect ratio will be wrong
                if (this._needsMatrixUpdate) {
                    this.updateMatrix(filter);
                }

                const videoWidth = filter.videoWidth;
                const videoHeight = filter.videoHeight;
                const domWidth = this.context.domWidth;
                const domHeight = this.context.domHeight;


                let needMatrixUpdate = false;
                if (videoHeight !== this._lastVideoHeight || videoWidth !== this._lastVideoWidth) {
                    needMatrixUpdate = true;
                }
                else if (domWidth !== this._lastDomWidth || domHeight !== this._lastDomHeight) {
                    needMatrixUpdate = true;
                }
                // Whenever the video aspect changes we want to update the matrix aspect to match the new video
                // This is so we don't have to modify the vertex positions of the mesh individually
                if (needMatrixUpdate) {
                    this._needsMatrixUpdate = true;
                }
            }
            this._geo?.update(face);
        }
    }

    /** Updates the matrix of the mesh to match the aspect ratio of the video */
    private updateMatrix(filter: NeedleFilterTrackingManager) {
        const mesh = this._mesh;
        if (!mesh) return;

        const videoWidth = filter.videoWidth;
        const videoHeight = filter.videoHeight;
        const domWidth = this.context.domWidth;
        const domHeight = this.context.domHeight;

        this._needsMatrixUpdate = false;
        this._lastVideoWidth = videoWidth;
        this._lastVideoHeight = videoHeight;
        this._lastDomWidth = domWidth;
        this._lastDomHeight = domHeight;
        const videoAspect = videoWidth / videoHeight;
        const domAspect = domWidth / domHeight;
        const aspect = videoAspect / domAspect;

        this._baseTransform ??= new Matrix4()
        this._baseTransform
            .identity()
            .setPosition(new Vector3(aspect, 1, 0))
            .scale(new Vector3(-2 * aspect, -2, 1));
        mesh.matrixAutoUpdate = false;
        mesh.matrixWorldAutoUpdate = true;
        mesh.frustumCulled = false;
        mesh.renderOrder = 1000;
        mesh.matrix.copy(this._baseTransform).premultiply(this.context.mainCamera.projectionMatrixInverse);
        if (mesh.parent != this.context.mainCamera)
            this.context.mainCamera.add(mesh);
    }
}

const faceMeshTextureFrag = `
precision highp float;
uniform sampler2D map;
uniform sampler2D mask;
varying vec2 vUv;
void main() {
    vec4 texColor = texture2D(map, vUv);
#ifdef HAS_MASK
    vec4 maskColor = texture2D(mask, vUv);
    gl_FragColor = texColor;
    gl_FragColor.a *= maskColor.r;
#else
    gl_FragColor = texColor;
#endif
}
`


export class FaceMeshTexture extends FaceMeshBehaviour {

    @serializable(Texture)
    texture: Texture | null = null;

    @serializable(Texture)
    mask: Texture | null = null;

    // @nonSerialized
    @serializable()
    get layout(): FaceLayout {
        console.warn("layout", this._layout);
        return this._layout;
    }
    set layout(value: FaceLayout) {
        console.log("SET", value)
        this._layout = value;
    }

    private _layout: FaceLayout = "mediapipe";

    protected createMaterial() {
        return new ShaderMaterial({
            wireframe: !this.texture,
            transparent: true,
            uniforms: {
                map: { value: this.texture },
                mask: { value: this.mask },
            },
            defines: {
                HAS_MASK: this.mask ? true : false,
            },
            fragmentShader: faceMeshTextureFrag,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `
        });
    }
}

declare type VideoClip = string;

export class FaceMeshVideo extends FaceMeshBehaviour {

    @serializable(URL)
    video: VideoClip | null = null;

    private _videoElement: HTMLVideoElement | null = null;
    private _videoTexture: VideoTexture | null = null;
    private _material: MeshBasicMaterial | null = null;

    protected createMaterial() {
        if (!this.video) {
            return null;
        }
        if (!this._videoElement) {
            const el = document.createElement("video") as HTMLVideoElement;
            this._videoElement = el;
            el.src = this.video;
            el.autoplay = true;
            el.muted = Application.userInteractionRegistered;
            el.loop = true;
            if (el.muted) {
                Application.registerWaitForInteraction(() => {
                    el.muted = false;
                    el.play();
                });
            }
            el.play();
        }
        this._videoTexture ??= new VideoTexture(this._videoElement);
        this._videoTexture.colorSpace = this.context.renderer.outputColorSpace;
        this._videoTexture.flipY = false;
        this._material ??= new MeshBasicMaterial({
            map: this._videoTexture,
            transparent: true,
        });
        return this._material;
    }

    update(): void {
        if (this._videoTexture) {
            this._videoTexture.update();
        }
    }
}