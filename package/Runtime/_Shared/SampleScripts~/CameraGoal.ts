import { Behaviour, GameObject, OrbitControls } from "@needle-tools/engine";

export class CameraGoal extends Behaviour {
    private _orbitalCamera?: OrbitControls;
    private get orbitalCamera() {
        this._orbitalCamera ??= GameObject.findObjectOfType(OrbitControls)!;
        return this._orbitalCamera;
    }

    use() {
        this.orbitalCamera?.setCameraTargetPosition(this.worldPosition);
    }
}