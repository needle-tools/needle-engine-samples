import { Behaviour, GameObject, OrbitControls } from "@needle-tools/engine";
import { Vector3 } from "three";

export class CameraGoal extends Behaviour {
    private _orbitalCamera?: OrbitControls;
    private get orbitalCamera() {
        this._orbitalCamera ??= GameObject.findObjectOfType(OrbitControls)!;
        return this._orbitalCamera;
    }   

    private tempVec: Vector3 = new Vector3();
    use() {
        this.gameObject.getWorldPosition(this.tempVec);
        this.orbitalCamera?.setCameraTargetPosition(this.tempVec);
    }
}