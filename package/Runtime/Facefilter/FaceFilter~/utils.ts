import { Camera, Material, Matrix4, Object3D, DoubleSide, MeshBasicMaterial, Mesh } from "three";
import { Category, FaceLandmarkerResult, Matrix } from "@mediapipe/tasks-vision"
import { Renderer } from "@needle-tools/engine";

let _occluderMaterial: Material | null = null;

export namespace FacefilterUtils {

    const tempMatrix = new Matrix4();

    export function applyFaceLandmarkMatrixToObject3D(obj: Object3D, mat: Matrix, camera: Camera) {
        const matrix = tempMatrix.fromArray(mat.data);
        obj.matrixAutoUpdate = false;
        obj.matrix.copy(matrix);
        obj.matrix.elements[12] *= 0.01;
        obj.matrix.elements[13] *= 0.01;
        obj.matrix.elements[14] *= 0.01;
        if (obj.parent !== camera)
            camera.add(obj);
    }

    export function getBlendshape(result: FaceLandmarkerResult | null, shape: BlendshapeName, index: number = 0): Category | null {
        if (!result) return null;
        if (result?.faceBlendshapes?.length > index) {
            const blendshape = result.faceBlendshapes[index];
            for (const cat of blendshape.categories) {
                if (cat.categoryName === shape) {
                    return cat;
                }
            }
        }
        return null;
    }
    export function getBlendshapeValue(result: FaceLandmarkerResult | null, shape: BlendshapeName, index: number = 0): number {
        const cat = getBlendshape(result, shape, index);
        return cat ? cat.score : -1;
    }

    export function makeOccluder(obj: Object3D) {
        if (!_occluderMaterial) {
            _occluderMaterial = new MeshBasicMaterial({ colorWrite: false, depthWrite: true, side: DoubleSide, transparent: false });
        }

        const occluderMaterial = _occluderMaterial as Material;
        assignMaterial(obj);
        obj.traverse(assignMaterial);

        function assignMaterial(child: any) {
            const obj = child as Object3D;
            // obj.scale.multiplyScalar(1.2);
            obj.renderOrder = -1;
            obj.matrixAutoUpdate = false;
            obj.updateMatrix();
            obj.updateMatrixWorld();
            obj.getComponents(Renderer).forEach(c => c.enabled = false);
            if (child.type === "Mesh" || child.type === "SkinnedMesh" || "material" in child) {
                const mat = (child as Mesh).material;
                if (Array.isArray(mat)) {
                    for (let i = 0; i < mat.length; i++) {
                        mat[i] = occluderMaterial;
                    }
                }
                else {
                    child.material = occluderMaterial;
                }
            }
        }
    }
}

/**
 * Blendshape Category Name options
 */
export declare type BlendshapeName =
    | "_neutral"
    | "browDownLeft"
    | "browDownRight"
    | "browInnerUp"
    | "browOuterUpLeft"
    | "browOuterUpRight"
    | "cheekPuff"
    | "cheekSquintLeft"
    | "cheekSquintRight"
    | "eyeBlinkLeft"
    | "eyeBlinkRight"
    | "eyeLookDownLeft"
    | "eyeLookDownRight"
    | "eyeLookInLeft"
    | "eyeLookInRight"
    | "eyeLookOutLeft"
    | "eyeLookOutRight"
    | "eyeLookUpLeft"
    | "eyeLookUpRight"
    | "eyeSquintLeft"
    | "eyeSquintRight"
    | "eyeWideLeft"
    | "eyeWideRight"
    | "jawForward"
    | "jawLeft"
    | "jawOpen"
    | "jawRight"
    | "mouthClose"
    | "mouthDimpleLeft"
    | "mouthDimpleRight"
    | "mouthFrownLeft"
    | "mouthFrownRight"
    | "mouthFunnel"
    | "mouthLeft"
    | "mouthLowerDownLeft"
    | "mouthLowerDownRight"
    | "mouthPressLeft"
    | "mouthPressRight"
    | "mouthPucker"
    | "mouthRight"
    | "mouthRollLower"
    | "mouthRollUpper"
    | "mouthShrugLower"
    | "mouthShrugUpper"
    | "mouthSmileLeft"
    | "mouthSmileRight"
    | "mouthStretchLeft"
    | "mouthStretchRight"
    | "mouthUpperUpLeft"
    | "mouthUpperUpRight"
    | "noseSneerLeft"
    | "noseSneerRight";