import { Behaviour, Camera } from "@needle-tools/engine";
import { KeyCode } from "@needle-tools/engine/src/engine/engine_input";
import CameraControls from "camera-controls";
import * as THREE from 'three';

// Using https://www.npmjs.com/package/camera-controls
// Examples: https://github.com/yomotsu/camera-controls/tree/dev/examples
// See: https://github.com/yomotsu/camera-controls


CameraControls.install({ THREE: THREE });

export class CameraControlsSample extends Behaviour {

    private _cameraControls?: CameraControls;

    onEnable(): void {

        if (!this._cameraControls) {
            // We can only create camera controls if we have a camera to control
            const camera = this.gameObject.getComponent(Camera);
            if (!camera) {
                console.warn("CameraControlsSample requires a camera to be attached to the same game object");
                return;
            }

            this._cameraControls = new CameraControls(camera.cam, this.context.domElement);
            this._cameraControls.touches.two = CameraControls.ACTION.TOUCH_ZOOM_TRUCK;

        }
    }

    onBeforeRender(): void {
        if (this._cameraControls) {
            this.onHandleInput();
            this._cameraControls.update(this.context.time.deltaTime);
        }
    }

    private onHandleInput() {

        if (!this._cameraControls) return;

        const t = this.context.time.deltaTime * 5;

        if (this.context.input.isKeyPressed(KeyCode.KEY_W)) {
            this._cameraControls.dolly(1 * t);
        }
        else if (this.context.input.isKeyPressed(KeyCode.KEY_S)) {
            this._cameraControls.dolly(-1 * t);
        }
        if (this.context.input.isKeyPressed(KeyCode.KEY_A)) {
            this._cameraControls.truck(-1 * t, 0);
        }
        else if (this.context.input.isKeyPressed(KeyCode.KEY_D)) {
            this._cameraControls.truck(1 * t, 0);
        }
    }
}  