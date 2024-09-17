import { Behaviour, Camera, Mathf, PointerType, getTempQuaternion, getTempVector, serializable } from "@needle-tools/engine";
import { Quaternion, Spherical, Vector2 } from "three";
import { Gyroscope } from "./Gyroscope";

const tempSpherical: Spherical = new Spherical();
const referenceFOV = 90;
const identityQuaternion = new Quaternion();
const tempVec2_A = new Vector2();
const tempVec2_B = new Vector2();

export class PanoramaControls extends Behaviour {
    protected gyroscope: Gyroscope = new Gyroscope();

    protected spherical: Spherical = new Spherical();
    protected sphericalTarget: Spherical = new Spherical();

    protected offsetQuaternion: Quaternion = new Quaternion();
    protected gyroscopeQuaternion: Quaternion = new Quaternion();

    /* Input */

    @serializable()
    gyroscopeInput: boolean = true;

    @serializable()
    pointerInput: boolean = true;

    /* Look */

    @serializable()
    rotateSpeed: number = 1;

    @serializable()
    rotateSmoothing: number = 5;

    /* Zoom  */

    @serializable()
    enableZoom: boolean = true;

    @serializable()
    zoomMin: number = 40;

    @serializable()
    zoomMax: number = 90;

    @serializable()
    zoomSpeed: number = 0.1;

    @serializable()
    zoomSmoothing: number = 5;

    /* Auto rotate */

    @serializable()
    autoRotate: boolean = true;

    @serializable()
    autoRotateSpeed: number = 0.15;

    @serializable()
    autoRotateTimeout: number = 3;

    protected currentZoom: number = 0;

    protected initialQuaternion: Quaternion = new Quaternion();
    protected camera?: Camera;
    protected userInputStamp: number = Number.MIN_SAFE_INTEGER;

    start() {
        this.initialQuaternion.copy(this.gameObject.quaternion);
        this.camera = this.gameObject.getComponent(Camera)!;

        this.gyroscope.onFail.addEventListener(() => {
            this.dispatchEvent(new Event("onFail"));
        });

        this.currentZoom = Mathf.lerp(this.zoomMin, this.zoomMax, 0.5);
        if (this.camera) {
            this.currentZoom = this.camera.fieldOfView!;
        }
    }

    onBeforeRender() {
        if (this.gyroscope.isActive !== this.gyroscopeInput) {
            if (this.gyroscopeInput) this.gyroscope.activate()
            else this.gyroscope.deactivate();
        }

        if (this.gyroscopeInput) {

            this.handleGyro();
        }

        if (this.pointerInput) {
            this.handleInput();
        }

        if (this.enableZoom) {
            this.handleZoom();
        }

        if (this.autoRotate) {
            this.handleAutoRotate();
        }

        this.applyRotation();
    }

    protected applyRotation() {
        const minMax = (Math.PI / 2) - (0.017 * 5);
        const dt = this.context.time.deltaTime;

        this.spherical.phi = Mathf.clamp(this.spherical.phi, -minMax, minMax);
        this.sphericalTarget.phi = Mathf.clamp(this.sphericalTarget.phi, -minMax, minMax);

        this.spherical.phi = Mathf.lerp(this.spherical.phi, this.sphericalTarget.phi, dt * this.rotateSmoothing);
        this.spherical.theta = Mathf.lerp(this.spherical.theta, this.sphericalTarget.theta, dt * this.rotateSmoothing);

        const xRot = getTempQuaternion().setFromAxisAngle(getTempVector(1, 0, 0), -this.spherical.phi);
        const yRot = getTempQuaternion().setFromAxisAngle(getTempVector(0, 1, 0), this.spherical.theta);

        this.offsetQuaternion.copy(this.initialQuaternion).multiply(yRot).multiply(xRot);
        
        this.gameObject.quaternion.copy(this.offsetQuaternion);
        this.gameObject.quaternion.multiply(this.gyroscopeQuaternion);
    }
    
    protected handleAutoRotate() {
        const time = this.context.time.time;
        const dt = this.context.time.deltaTime;
        if (time - this.userInputStamp > this.autoRotateTimeout) {
            this.sphericalTarget.theta += this.autoRotateSpeed * dt;
            this.sphericalTarget.phi = 0;
        }
    }

    protected handleInput() {
        const input = this.context.input;
        const element = this.context.renderer.domElement;

        if (input.getPointerPressedCount() == 1) {
            const delta = input.getPointerPositionDelta(0)!;
            const speed = this.rotateSpeed * (this.camera?.fieldOfView ?? referenceFOV) / referenceFOV;
            this.sphericalTarget.phi +=  2 * Math.PI * delta.y / element.clientHeight * speed;
            this.sphericalTarget.theta -= 2 * Math.PI * delta.x / element.clientWidth * speed;
            
            this.userInputStamp = this.context.time.time;
        }
    }

    protected handleZoom() {
        const zoom = this.getZoomInput();
        this.currentZoom += zoom * this.zoomSpeed;
        this.currentZoom = Mathf.clamp(this.currentZoom, this.zoomMin, this.zoomMax);
        
        if (this.camera) {
            const dt = this.context.time.deltaTime;
            this.camera.fieldOfView = Mathf.lerp(this.camera.fieldOfView ?? 0, this.currentZoom, this.zoomSmoothing * dt);
        }            

        if (Math.abs(zoom) > Number.EPSILON) {
            this.userInputStamp = this.context.time.time;
        }
    }

    protected handleGyro() {
        const gyroQuaternion = this.gyroscope.quaternion;

        if (gyroQuaternion && this.gyroscope.isConnected) {
            this.gyroscopeQuaternion.copy(gyroQuaternion);

            // reset xRot to 0
            this.sphericalTarget.phi = 0;

            // never activate auto rotate when using gyro
            this.userInputStamp = this.context.time.time;
        }
        else {
            this.gyroscopeQuaternion.identity();
        }
    }

    protected previousPinchDistance: number | undefined = undefined;
    /* returns zoom delta */
    protected getZoomInput(): number {
        let delta = 0; 

        // PC - scrollwheel
        const input = this.context.input;
        delta = input.getMouseWheelDeltaY() * 0.1;

        // Touch - pinch
        if (input.getTouchesPressedCount() == 2) {
            for (const id of input.foreachPointerId(PointerType.Touch)) {
                const pos = input.getPointerPosition(id)!;
                tempVec2_B.copy(tempVec2_A);
                tempVec2_A.copy(pos);
            }

            const pinchDistance = tempVec2_A.distanceTo(tempVec2_B);
            if(this.previousPinchDistance) {
                delta += this.previousPinchDistance - pinchDistance;
            }
            this.previousPinchDistance = pinchDistance;
        }
        else 
            this.previousPinchDistance = undefined;

        // VR - joystick
        // TODO: implement

        return delta;
    }
}