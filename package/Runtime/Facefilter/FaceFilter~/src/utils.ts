import { Camera, Material, Matrix4, Object3D, DoubleSide, MeshBasicMaterial, Mesh, Quaternion, Color } from "three";
import { Category, FaceLandmarkerResult, Matrix } from "@mediapipe/tasks-vision"
import { Renderer } from "@needle-tools/engine";
import { mirror } from "./settings.js";

let _occluderMaterial: MeshBasicMaterial | null = null;

const flipxMat = new Matrix4().makeScale(-1, 1, 1);
const offset = new Matrix4().makeTranslation(0.000, 0.015, -.01);
const offsetMirror = offset.clone().premultiply(flipxMat);

export namespace FacefilterUtils {

    const tempMatrix = new Matrix4();

    export function flipX(matrix: Matrix4) {
        matrix.premultiply(flipxMat);
    }

    export function applyFaceLandmarkMatrixToObject3D(obj: Object3D, mat: Matrix, camera: Camera) {
        const matrix = tempMatrix.fromArray(mat.data);
        obj.matrixAutoUpdate = false;
        obj.matrix.copy(matrix);

        obj.matrix.elements[12] *= 0.01;
        obj.matrix.elements[13] *= 0.01;
        obj.matrix.elements[14] *= 0.01;

        // obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
        // obj.position.multiplyScalar(0.01);
        // obj.quaternion.multiply(obj.quaternion)
        // obj.updateMatrix();
        // obj.quaternion



        // obj.matrix.premultiply(flipxMat);
        if (mirror) obj.matrix.premultiply(offsetMirror);
        else obj.matrix.premultiply(offset);

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

    export function makeOccluder(obj: Object3D, renderOrder: number = -5) {
        if (!_occluderMaterial) {
            _occluderMaterial = new MeshBasicMaterial({

                colorWrite: false,
                depthWrite: true,
                side: DoubleSide,
            });
            // _occluderMaterial.transparent = true;
            // _occluderMaterial.opacity = .05;
            // _occluderMaterial.color = new Color("#ddffff");
            // _occluderMaterial.wireframe = true;
            // _occluderMaterial.colorWrite = true;
        }

        const occluderMaterial = _occluderMaterial as Material;
        assignMaterial(obj);
        obj.traverse(assignMaterial);

        function assignMaterial(child: any) {
            const obj = child as Object3D;
            obj.renderOrder = renderOrder;
            obj.matrixAutoUpdate = false;
            obj.updateMatrix();
            obj.updateMatrixWorld();
            obj.getComponents(Renderer).forEach(c => c.destroy());
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