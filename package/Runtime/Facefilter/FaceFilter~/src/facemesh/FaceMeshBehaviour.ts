import { serializable, NEEDLE_progressive, Application } from "@needle-tools/engine";
import { Texture, Mesh, Matrix4, MeshBasicMaterial, Vector3, Material, VideoTexture, ShaderMaterial, TextureLoader } from "three";
import { FilterBehaviour } from "../Behaviours.js";
import { NeedleFilterTrackingManager } from "../FaceFilter.js";
import { FaceGeometry, FaceLayout } from "./utils.facemesh.js";

export abstract class FaceMeshBehaviour extends FilterBehaviour {

    @serializable()
    allowDrop: boolean = true;

    protected createMesh() {
        const mat = this.createMaterial();
        if (mat) {
            NEEDLE_progressive.assignTextureLOD(mat, 0);
            this.setupTextureProperties(mat);
            const geom = FaceGeometry.create(this.layout);
            this.__currentMesh = new Mesh(geom, mat);
            this.__currentMesh.name = this.name + " (Face Mesh)";
            this.__currentGeometry = geom;
            this.__currentMaterial = mat;
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

    /** The currently rendered face mesh (if any) */
    get mesh() { return this.__currentMesh; }
    /** The currently used material for the face mesh. */
    get material() { return this.__currentMaterial; }


    // internal state
    private __currentMesh: Mesh | null = null;
    private __currentGeometry: FaceGeometry | null = null;
    private __currentMaterial: Material | null = null;
    private _baseTransform: Matrix4 = new Matrix4();
    private _lastVideoWidth = 0;
    private _lastVideoHeight = 0;
    private _lastDomWidth = 0;
    private _lastDomHeight = 0;
    private _needsMatrixUpdate = false;

    /** @internal */
    onEnable(): void {
        if (!this.__currentMesh) this.createMesh();
        this._lastDomWidth = 0;
        this._lastDomHeight = 0;
        window.addEventListener("dragover", this._onDropOver);
        window.addEventListener("drop", this._onDrop);
        if (this.allowDrop) {
            console.log(`Update the face filter by dropping a PNG, JPG, JPEG, WEBP or GIF image file. \nMake sure you use the \"${this.layout}\" layout`);
        }
    }
    /** @internal */
    onDisable(): void {
        this.__currentMesh?.removeFromParent();
        window.removeEventListener("dragover", this._onDropOver);
        window.removeEventListener("drop", this._onDrop);
    }

    private _lastFilterIndex: number = -1;

    /** @internal */
    onResultsUpdated(filter: NeedleFilterTrackingManager, index: number): void {
        const lm = filter.facelandmarkerResult?.faceLandmarks;
        if (lm && lm.length > 0) {

            const needsSmoothing = filter.maxFaces > 1 && this._lastFilterIndex === filter.currentFilterIndex;
            const face = lm[index];
            if (this.__currentMesh && face) {

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
                this._lastFilterIndex = filter.currentFilterIndex;
            }
            this.__currentGeometry?.update(face, needsSmoothing);
        }
    }

    /** Updates the matrix of the mesh to match the aspect ratio of the video */
    private updateMatrix(filter: NeedleFilterTrackingManager) {
        const mesh = this.__currentMesh;
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
        mesh.matrixWorldAutoUpdate = true; // < needs to be enabled since three 169
        mesh.frustumCulled = false;
        mesh.renderOrder = 1000;
        mesh.matrix.copy(this._baseTransform).premultiply(this.context.mainCamera.projectionMatrixInverse);
        if (mesh.parent != this.context.mainCamera)
            this.context.mainCamera.add(mesh);
    }

    private _onDropOver = (evt: DragEvent) => {
        if (!this.allowDrop) return;
        evt.preventDefault();
    }
    private _onDrop = (evt: DragEvent) => {
        if (!this.allowDrop) return;
        evt.preventDefault();
        if (!this.__currentMaterial) {
            console.warn("Can not handle texture drop - there's no material to apply the texture to...");
            return;
        }

        const files = evt.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            const ext = file.name.split(".").pop()?.toLowerCase();
            const mat = this.__currentMaterial;
            switch (ext) {
                case "jpg":
                case "jpeg":
                case "png":
                case "webp":
                case "gif":
                    const url = URL.createObjectURL(file);
                    console.debug("Loading texture", url);
                    new TextureLoader().loadAsync(url).then(tex => {
                        console.debug("Loaded texture", tex, mat);
                        tex.flipY = false;
                        if ("map" in mat) {
                            mat["map"] = tex;
                            mat.needsUpdate = true;
                        }
                        if (mat instanceof ShaderMaterial) {
                            if (mat.uniforms.map) {
                                console.debug("Setting texture in map uniform");
                                mat.uniforms.map.value = tex;
                                mat.needsUpdate = true;
                                mat.uniformsNeedUpdate = true;
                            }
                        }
                        this.onTextureChanged();
                    });
                    break;
                default:
                    console.log("Unsupported file type: " + ext);
                    break;
            }
        }
    }

    protected onTextureChanged() {

    }
}

const faceMeshTextureFrag = `

precision highp float;
uniform sampler2D map;
uniform sampler2D mask;
varying vec2 vUv;
void main() {
    vec4 texColor = texture2D(map, vUv);
    gl_FragColor = texColor;
#ifdef HAS_MASK
    vec4 maskColor = texture2D(mask, vUv);
    gl_FragColor.a *= maskColor.r;
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
    set layout(value: FaceLayout) { this.__layout = value; }
    get layout(): FaceLayout { return this.__layout; }
    private __layout: FaceLayout = "mediapipe";

    private _material: ShaderMaterial | null = null;

    protected createMaterial() {
        // return new MeshBasicMaterial({
        //     transparent: true,
        //     // map: this.texture,
        // });
        return this._material = new ShaderMaterial({
            uniforms: {
                map: { value: this.texture },
                mask: { value: this.mask },
            },
            defines: {
                HAS_MASK: this.mask ? true : false,
            },
            wireframe: false,
            transparent: true,
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

export class FaceMeshCustomShader extends FaceMeshBehaviour {

    private __material: Material | null = null;

    // @type UnityEngine.Material
    @serializable(Material)
    public get material(): Material | null {
        return this.__material;
    }
    public set material(value: Material | null) {
        console.log(value)
        this.__material = value;
    }

    protected createMaterial(): Material | null {
        console.log("Creating custom material", this.material);
        return this.material;
    }
}

declare type VideoClip = string;

export class FaceMeshVideo extends FaceMeshBehaviour {

    @serializable(URL)
    video: VideoClip | null = null;

    private _videoElement: HTMLVideoElement | null = null;
    private _videoTexture: VideoTexture | null = null;

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
        const mat = new MeshBasicMaterial({
            map: this._videoTexture,
            transparent: true,
        });
        return mat;
    }

    update(): void {
        if (this._videoTexture) {
            this._videoTexture.update();
        }
    }
}