import { Vector3, Quaternion, Matrix4 } from "three";
import { getTempQuaternion, getTempVector } from "@needle-tools/engine"

export function mediapipeToThreejsMatrix(mat: number[]): {
    translation: Vector3;
    rotation: Quaternion;
    scale: Vector3;
} {
    let matrix4x4 = new Matrix4().fromArray(mat);
    let translation = getTempVector();
    let rotation = getTempQuaternion();
    let scale = getTempVector();
    matrix4x4.decompose(translation, rotation, scale);
    return {
        translation: translation,
        rotation: rotation,
        scale: scale,
    };
};