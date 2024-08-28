import { Camera, Matrix4, Object3D } from "three";
import { Matrix } from "@mediapipe/tasks-vision"

export namespace NeedleMediaPipeUtils {

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
}
