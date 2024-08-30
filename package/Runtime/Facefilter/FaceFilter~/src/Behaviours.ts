import { Animator, BehaviorExtension, Behaviour, getComponentInChildren, serializable } from '@needle-tools/engine';
import type { Facefilter } from './FaceFilter.js';
import { Matrix4, Mesh, Object3D, SkinnedMesh, Vector3 } from 'three';
import { BlendshapeName, FacefilterUtils } from './utils.js';

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

                // Is this a ReadyPlayerMe avatar?
                if (obj.userData?.name === "Wolf3D_Head") {
                    this._type = "ReadyPlayerMe";
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
    }



    private _filter: Facefilter | null = null;
    private _behaviours: FilterBehaviour[] = [];

    onResultsUpdated(filter: Facefilter) {
        if (!this._filter) {
            this._filter = filter;
            console.log("Avatar behaviour initialized");
            this.gameObject.addComponent(FaceFilterBlendshapes);
            this._behaviours = this.gameObject.getComponentsInChildren(FilterBehaviour);
        }
        for (const beh of this._behaviours) {
            beh.onResultsUpdated(filter);
        }
    }

    onBeforeRender(): void {
        const res = this._filter?.result;
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
    onResultsUpdated(filter: Facefilter): void;
}

export abstract class FilterBehaviour extends Behaviour implements IFilterBehaviour {
    abstract onResultsUpdated(_filter: Facefilter): void;
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
            console.log("Blendshape mapping", this.blendshapeMap);
    }

    onResultsUpdated(filter: Facefilter) {
        // TODO: handle multiple faces
        const face = filter.result?.faceBlendshapes?.[0]
        if (face && this._skinnedMeshes.length > 0) {
            // we iterate all blendshape values and set the corresponding morph target influence
            // some meshes might have different names so we need to remap them
            for (const shape of face.categories) {
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
                        else if (shape.categoryName.includes("eyeBlink")) {
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

    onResultsUpdated(filter: Facefilter) {
        if (!this._animators?.length) return;

        const face = filter.result?.faceBlendshapes?.[0]
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