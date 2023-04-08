import { Behaviour, Camera } from "@needle-tools/engine";
import { KeyCode } from "@needle-tools/engine/src/engine/engine_input";
import CameraControls from "camera-controls";
import * as THREE from 'three';

// Using https://www.npmjs.com/package/camera-controls
// Examples: https://github.com/yomotsu/camera-controls/tree/dev/examples
// See: https://github.com/yomotsu/camera-controls


CameraControls.install({ THREE: THREE });

export class FirstPersonSample extends Behaviour {

    private _cameraControls?: CameraControls;

    onEnable(): void {

        if (!this._cameraControls) {
            const cameraControls = this._cameraControls = new CameraControls(this.gameObject, this.context.domElement);
            cameraControls.minDistance = cameraControls.maxDistance = 1;
            cameraControls.azimuthRotateSpeed = - 0.3; // negative value to invert rotation direction
            cameraControls.polarRotateSpeed = - 0.3; // negative value to invert rotation direction
            cameraControls.minZoom = .7;
            cameraControls.maxZoom = 2;
            cameraControls.mouseButtons.wheel = CameraControls.ACTION.ZOOM;
            cameraControls.touches.two = CameraControls.ACTION.TOUCH_ZOOM_TRUCK;
            this.move(.0001);
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
        const speed = 5;
        const t = this.context.time.deltaTime * speed;

        if (this.context.input.isKeyPressed(KeyCode.KEY_W)) {
            this.move(1 * t);
        }
        else if (this.context.input.isKeyPressed(KeyCode.KEY_S)) {
            this.move(-1 * t);
        }
        else if(this.context.input.isKeyPressed(KeyCode.KEY_E)) {
            this.move(0, 1 * t);
        }
        else if(this.context.input.isKeyPressed(KeyCode.KEY_Q)) {
            this.move(0, -1 * t);
        }
        if (this.context.input.isKeyPressed(KeyCode.KEY_A)) {
            this._cameraControls.truck(-1 * t, 0);
        }
        else if (this.context.input.isKeyPressed(KeyCode.KEY_D)) {
            this._cameraControls.truck(1 * t, 0);
        }
    }

    private move(forwardFactor: number, upFactor: number = 0) {
        if (!this._cameraControls) return;

        if(forwardFactor == 0) forwardFactor = .000001;

        const dir = this.forward.multiplyScalar(forwardFactor);
        const newPosition = this.gameObject.position.add(dir);

        if (upFactor != 0) {
            const up = this.up.multiplyScalar(upFactor);
            newPosition.add(up);
        }

        this._cameraControls.setPosition(newPosition.x, newPosition.y, newPosition.z);

        const world = this.worldPosition;
        if (forwardFactor > 0)
            world.add(dir);
        else
            world.sub(dir);
        this._cameraControls.setTarget(world.x, world.y, world.z);
    }
}  