import { Animator, BehaviorExtension, Behaviour, getComponentInChildren, NEEDLE_progressive, serializable } from '@needle-tools/engine';
import type { NeedleFilterTrackingManager } from './FaceFilter.js';
import { DoubleSide, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, SkinnedMesh, Texture, Vector3 } from 'three';
import { BlendshapeName, FacefilterUtils } from './utils.js';
import { FaceGeometry, MediapipeHelper as MediapipeFaceHelper, TRIANGULATION } from './utils.facemesh.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
// import { FaceMeshFaceGeometry } from './facemesh.js';

declare type AvatarType = "Unknown" | "ReadyPlayerMe";

/**
 * Root Filter behaviour
 */
export class FaceFilterRoot extends Behaviour {

    @serializable()
    overrideDefaultOccluder: boolean = false;

    private _type: AvatarType = "Unknown";
    private _headMatrix: Matrix4 | null = null;
    private _initialScale!: Vector3;

    private _leftEye: Object3D | null = null;
    private _rightEye: Object3D | null = null;

    awake() {
        this._initialScale ??= this.gameObject?.scale.clone();
        this._headMatrix = null;
        this.setupHead();
    }

    private setupHead() {
        let head: Object3D | null = null;
        let headTopEnd: Object3D | null = null;

        // First check if we have a face placement helper assigned
        // If so this is the exact object that we use for the face position
        const face = this.gameObject.getComponentInChildren(FaceFilterHeadPosition);
        if (face) {
            head = face.gameObject;
        }
        else {

            const readyPlayerMeEyeBoneNames = ["LeftEye", "RightEye"];
            const readyPlayerMeBodyAssetNames = ["Wolf3D_Body", "Wolf3D_Outfit_Bottom", "Wolf3D_Outfit_Footwear", "Wolf3D_Outfit_Top"];
            const bodyAssetsToHide = new Array<Object3D>();

            /** Fallback method to determine the head matrix */
            const scanAvatar = (obj: Object3D): void => {

                if (!head) {
                    if (obj.userData?.name === "Head") {
                        head = obj;
                    }
                }

                if (obj.userData?.name === "HeadTop_End") {
                    headTopEnd = obj;
                }

                if (readyPlayerMeBodyAssetNames.includes(obj.userData?.name)) {
                    bodyAssetsToHide.push(obj);
                }

                // Is this a ReadyPlayerMe avatar?
                if (obj.userData?.name === "Wolf3D_Head") {
                    this._type = "ReadyPlayerMe";
                }

                // Get eyes
                if (obj.userData?.name === "LeftEye") {
                    this._leftEye = obj;
                    console.log(this);
                }
                else if (obj.userData?.name === "RightEye") {
                    this._rightEye = obj;
                }

                // Traverse
                for (const child of obj.children) {
                    scanAvatar(child);
                }
            }

            scanAvatar(this.gameObject);

            if (head) {
                const headOffsetObject = new Object3D();
                (head as Object3D).add(headOffsetObject);
                head = headOffsetObject;
                // handle specific defaults for different avatar types
                switch (this._type) {
                    case "ReadyPlayerMe":
                        this.overrideDefaultOccluder = true;
                        headOffsetObject.position.set(0, .07, .05);
                        bodyAssetsToHide.forEach(obj => obj.visible = false);
                        break;
                }
            }
            else {
                console.warn("No head object found in avatar rig");
            }
        }


        if (head) {
            // The matrix of the root object should not affect the head object
            // E.g. if the root avatar is offset in the scene at the moment/scaled/rotated... it doesnt matter
            // We only care about the matrix of the found head WITHIN this rig
            const parent = this.gameObject.parent;
            this.gameObject.parent = null;
            this.gameObject.matrixAutoUpdate = false;
            this.gameObject.matrix.identity();
            this.gameObject.matrixWorld.identity();

            // Calculate the head matrix
            head.updateWorldMatrix(true, false);
            this._headMatrix = new Matrix4();
            this._headMatrix.copy(head.matrixWorld);
            // apply the scale of the initial object
            const scale = this._initialScale.clone();
            scale.x = 1 / scale.x;
            scale.y = 1 / scale.y;
            scale.z = 1 / scale.z;
            this._headMatrix.scale(scale);
            // the matrix will be used to transform the root to the head so we invert it
            this._headMatrix.invert();
            // when we are rendering in mirror mode we want to flip the head matrix
            FacefilterUtils.flipX(this._headMatrix);

            // Reset the parent
            this.gameObject.parent = parent;
        }
        else {
            // apply the root scale if nothing is setup and no head object is found
            this._headMatrix = new Matrix4();
            this._headMatrix.scale(this._initialScale);
        }

        if (this._leftEye || this._rightEye) {
            const eyes = this.gameObject.getOrAddComponent(FaceFilterEyeBehaviour);
            eyes.eyeLeft = this._leftEye;
            eyes.eyeRight = this._rightEye;
            this._behaviours?.push(eyes);
        }
    }



    private _filter: NeedleFilterTrackingManager | null = null;
    private _behaviours: FilterBehaviour[] = [];

    onResultsUpdated(filter: NeedleFilterTrackingManager) {
        if (!this._filter) {
            this._filter = filter;
            console.debug("Avatar behaviour initialized");
            this.gameObject.getOrAddComponent(FaceFilterBlendshapes);
            this.gameObject.getOrAddComponent(FaceFilterAnimator);
            this._behaviours = this.gameObject.getComponentsInChildren(FilterBehaviour);
        }
        for (const beh of this._behaviours) {
            beh.onResultsUpdated(filter);
        }
    }

    onBeforeRender(): void {
        const res = this._filter?.facelandmarkerResult;
        if (!res) return;
        const lm = res.facialTransformationMatrixes[0];
        if (!lm) return;
        FacefilterUtils.applyFaceLandmarkMatrixToObject3D(this.gameObject, lm, this.context.mainCamera);
        this.gameObject.matrixAutoUpdate = false;
        if (this._headMatrix) {
            this.gameObject.matrix.multiply(this._headMatrix);
        }
    }



}


export interface IFilterBehaviour {
    onResultsUpdated(filter: NeedleFilterTrackingManager): void;
}

export abstract class FilterBehaviour extends Behaviour implements IFilterBehaviour {
    abstract onResultsUpdated(_filter: NeedleFilterTrackingManager): void;
}

/**
 * Marks the face position in the avatar
 */
export class FaceFilterHeadPosition extends Behaviour {

    @serializable(Matrix4)
    matrix: Matrix4 = new Matrix4();
}


declare type MeshWithBlendshapes = Mesh & {
    morphTargetInfluences: number[];
    morphTargetDictionary: { [key: string]: number };
}

declare type RemapData = { key: string, factor: number };
declare type BlendshapeMap = Partial<Record<BlendshapeName, RemapData>>;

export class FaceFilterBlendshapes extends FilterBehaviour {

    // TODO: expose in Unity 
    @serializable()
    blendshapeMap: BlendshapeMap = {};

    private _skinnedMeshes: MeshWithBlendshapes[] = [];

    onEnable(): void {
        this._skinnedMeshes = [];
        this.blendshapeMap ??= {};

        this.gameObject.traverse((child) => {
            if (child instanceof SkinnedMesh || child instanceof Mesh) {
                const mesh = child as MeshWithBlendshapes;
                if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
                    this._skinnedMeshes.push(mesh);
                    for (const key of Object.keys(mesh.morphTargetDictionary)) {
                        switch (key) {
                            case "mouthOpen":
                                this.blendshapeMap["jawOpen"] = { key, factor: 3, };
                                break;
                            case "mouthSmile":
                                this.blendshapeMap["mouthSmileLeft"] = { key, factor: 1, };
                                this.blendshapeMap["mouthSmileRight"] = { key, factor: 1, };
                                break;
                        }
                    }
                }
            }
        });

        if (Object.keys(this.blendshapeMap).length > 0)
            console.debug("Blendshape mapping", this.blendshapeMap);
    }

    onResultsUpdated(filter: NeedleFilterTrackingManager) {
        // TODO: handle multiple faces
        const face = filter.facelandmarkerResult?.faceBlendshapes?.[0]
        if (face && this._skinnedMeshes.length > 0) {
            // we iterate all blendshape values and set the corresponding morph target influence
            // some meshes might have different names so we need to remap them
            for (const shape of face.categories) {
                const blendshapeName = shape.categoryName;

                let name = shape.categoryName;

                const remapData: RemapData = this.blendshapeMap[name];
                if (remapData?.key) {
                    name = remapData.key;
                }


                for (const mesh of this._skinnedMeshes) {
                    const index = mesh.morphTargetDictionary[name];
                    if (index !== undefined && index !== null) {
                        let value = shape.score;

                        if (remapData?.factor != undefined) {
                            value *= remapData.factor;
                        }

                        // The eye blink values seem to never exceed ranges between 0 (totally open) and 0.5 (totally closed)   
                        else if (blendshapeName.includes("eyeBlink")) {
                            value = value * 1.5;
                        }

                        mesh.morphTargetInfluences[index] = value;
                    }
                    // else {
                    //     if (this.context.time.frameCount % 180 === 0)
                    //         console.warn(`No morph target found for blendshape ${name}`, mesh.morphTargetDictionary)
                    // }
                }
            }
        }
    }
}



export class FaceFilterAnimator extends FilterBehaviour {

    private _animators: Animator[] = [];

    awake(): void {
        this._animators = this.gameObject.getComponentsInChildren(Animator);
    }

    onResultsUpdated(filter: NeedleFilterTrackingManager) {
        if (!this._animators?.length) return;

        const face = filter.facelandmarkerResult?.faceBlendshapes?.[0]
        if (face) {
            // we iterate all blendshape values and set the corresponding morph target influence
            // some meshes might have different names so we need to remap them
            for (const shape of face.categories) {
                const name = shape.categoryName;
                for (const anim of this._animators) {
                    // if(name.includes("jawOpen")) console.log(shape.score)
                    anim.setFloat(name, shape.score);
                }
            }
        }
    }
}


const leftEyeDownIndex = 11;
const rightEyeDownIndex = 12;
const leftEyeLookInIndex = 13;
const rightEyeLookInIndex = 14;
const leftEyeLookOutIndex = 15;
const rightEyeLookOutIndex = 16;
const leftEyeLookUpIndex = 17;
const rightEyeLookUpIndex = 18;

const leftEyeBlinkIndex = 9;
const rightEyeBlinkIndex = 10;

export class FaceFilterEyeBehaviour extends FilterBehaviour {

    @serializable(Object3D)
    eyeRight: Object3D | null = null;

    @serializable(Object3D)
    eyeLeft: Object3D | null = null;

    onResultsUpdated(_filter: NeedleFilterTrackingManager): void {
        const face = _filter.facelandmarkerResult?.faceBlendshapes?.[0];
        if (!face) return;

        // TODO: we currently assume that Z is the forward axis

        if (this.eyeLeft) {
            // const leftBlink = face.categories[leftEyeBlinkIndex].score;
            const leftDown = face.categories[leftEyeDownIndex].score;
            const leftIn = face.categories[leftEyeLookInIndex].score;
            const leftOut = face.categories[leftEyeLookOutIndex].score;
            const leftUp = face.categories[leftEyeLookUpIndex].score;
            this.updateRotation(this.eyeLeft!, leftDown, leftUp, -leftIn, -leftOut);
        }

        if (this.eyeRight) {
            const rightDown = face.categories[rightEyeDownIndex].score;
            const rightIn = face.categories[rightEyeLookInIndex].score;
            const rightOut = face.categories[rightEyeLookOutIndex].score;
            const rightUp = face.categories[rightEyeLookUpIndex].score;
            this.updateRotation(this.eyeRight!, rightDown, rightUp, rightIn, rightOut);
        }
    }

    private updateRotation(object: Object3D, down: number, up: number, left: number, right: number) {

        down *= 1.5;
        up *= 1.5;

        const x = ((up - down) * -0.6)
        const y = ((left - right) * 0.6);
        object.rotation.set(x, y, object.rotation.z);
    }
}



export class FaceMeshBehaviour extends FilterBehaviour {

    @serializable(Texture)
    texture: Texture | null = null;

    private _mesh: Mesh | null = null;
    private _geo: FaceGeometry | null = null;
    private _baseTransform: Matrix4 = new Matrix4();

    private _lastVideoWidth = 0;
    private _lastVideoHeight = 0;
    private _lastDomWidth = 0;
    private _lastDomHeight = 0;

    awake() {
        const geom = FaceGeometry.create();
        const mat = new MeshBasicMaterial({
            map: this.texture,
            wireframe: !this.texture,
            transparent: true,
            // depthTest: false,
            // side: DoubleSide, 
        });
        if (this.texture) {
            this.texture.colorSpace = this.context.renderer.outputColorSpace;
            NEEDLE_progressive.assignTextureLOD(this.texture, 0).then(res => {
                if (res && mat && res instanceof Texture) mat.map = res;
            })
        }

        this._mesh = new Mesh(geom, mat);
        this._geo = geom;
    }

    onEnable(): void {
        this._lastDomWidth = 0;
        this._lastDomHeight = 0;
    }
    onDisable(): void {
        this._mesh?.removeFromParent();
    }

    onResultsUpdated(filter: NeedleFilterTrackingManager): void {
        const lm = filter.facelandmarkerResult?.faceLandmarks;
        if (lm && lm.length > 0) {
            const face = lm[0];
            if (this._mesh) {
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
                    this._lastVideoWidth = videoWidth;
                    this._lastVideoHeight = videoHeight;
                    this._lastDomWidth = domWidth;
                    this._lastDomHeight = domHeight;
                    const aspect = videoWidth / videoHeight;
                    const domAspect = domWidth / domHeight;
                    this.updateMatrix(this._mesh, aspect / domAspect);
                }
            }
            this._geo?.update(face);
        }
    }

    /** Updates the matrix of the mesh to match the aspect ratio of the video */
    private updateMatrix(mesh: Mesh, aspect: number) {
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
