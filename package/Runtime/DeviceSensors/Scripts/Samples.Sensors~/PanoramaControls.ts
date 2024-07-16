import { Behaviour, Camera, Mathf, PointerType, getTempQuaternion, getTempVector, serializeable } from "@needle-tools/engine";
import { Euler, Quaternion, Spherical, Vector2 } from "three";
import { Gyroscope } from "./Gyroscope";

const referenceFOV = 90;
const identityQuaternion = new Quaternion();
const tempVec2_A = new Vector2();
const tempVec2_B = new Vector2();

export class PanoramaControls extends Behaviour {
    protected gyroscope: Gyroscope = new Gyroscope();

    protected sphericalTarget: Spherical = new Spherical();

    /* Input */

    @serializeable()
    gyroscopeInput: boolean = true;

    @serializeable()
    pointerInput: boolean = true;

    /* Look */

    @serializeable()
    rotateSpeed: number = 1;

    @serializeable()
    rotateSmoothing: number = 5;

    /* Zoom  */

    @serializeable()
    enableZoom: boolean = true;

    @serializeable()
    zoomMin: number = 40;

    @serializeable()
    zoomMax: number = 90;

    @serializeable()
    zoomSpeed: number = 0.1;

    @serializeable()
    zoomSmoothing: number = 5;

    /* Auto rotate */

    @serializeable()
    autoRotate: boolean = true;

    @serializeable()
    autoRotateSpeed: number = 0.15;

    @serializeable()
    autoRotateTimeout: number = 3;

    protected currentZoom: number = 0;

    protected initialQuaternion: Quaternion = new Quaternion();
    
    protected offsetQuaternion: Quaternion = new Quaternion();
    protected targetQuaternion: Quaternion = new Quaternion();

    protected camera?: Camera;
    protected userInputStamp: number = Number.MIN_SAFE_INTEGER;

    start() {
        this.initialQuaternion.copy(this.gameObject.quaternion);
        this.camera = this.gameObject.getComponent(Camera)!;

        this.gyroscope.onFail.addEventListener(() => {
            this.dispatchEvent(new Event("onfail"));
        });

        this.currentZoom = Mathf.lerp(this.zoomMin, this.zoomMax, 0.5);
        if (this.camera) {
            this.currentZoom = this.camera.fieldOfView!;
        }
    }

    protected initialTargetRotation?: Quaternion;
    protected lastGyro: Quaternion = new Quaternion();
    onBeforeRender() {
        if (this.gyroscope.isActive !== this.gyroscopeInput) {
            if (this.gyroscopeInput) this.gyroscope.activate()
            else this.gyroscope.deactivate();
        }

        if (this.gyroscopeInput)
            this.handleGyro();

        if (this.pointerInput)
            this.handleInput();

        if (this.enableZoom)
            this.handleZoom();

        if (this.autoRotate)
            this.handleAutoRotate();

        this.applyRotation();
    }

    private tempQuaternion = new Quaternion();
    protected applyRotation() {
        const minMax = (Math.PI / 2) - (0.017 * 5);

        this.sphericalTarget.phi = Mathf.clamp(this.sphericalTarget.phi, -minMax, minMax);
        
        const dt = this.context.time.deltaTime;

        this.offsetQuaternion.premultiply(this.tempQuaternion.setFromAxisAngle(getTempVector(0, 1, 0), -this.sphericalTarget.theta));
        this.offsetQuaternion.multiply(this.tempQuaternion.setFromAxisAngle(getTempVector(1, 0, 0), this.sphericalTarget.phi));
        this.sphericalTarget.theta = 0;
        this.sphericalTarget.phi = 0;
        this.targetQuaternion.slerp(this.offsetQuaternion, dt * this.rotateSmoothing);
        this.gameObject.quaternion.copy(this.initialQuaternion);
        this.gameObject.quaternion.multiply(this.targetQuaternion);

        this.gameObject.matrixWorldNeedsUpdate = true;
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
        if (!this.gyroscope.isConnected) return;

        const gyroQuaternion = this.gyroscope.quaternion;
        const gyroDelta = this.gyroscope.getDelta(this.lastGyro);

        if (gyroQuaternion && gyroDelta) {
            if (!this.initialTargetRotation) {
                this.initialTargetRotation = this.gameObject.quaternion.clone();
            }

            if (gyroDelta.angleTo(identityQuaternion) > 0.001) {
                this.lastGyro.copy(gyroQuaternion);
                this.userInputStamp = this.context.time.time;
                // applied to both to avoid smoothing
                this.offsetQuaternion.multiply(gyroDelta);
                this.targetQuaternion.multiply(gyroDelta);
            }
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