import { Behaviour, Camera, Mathf, PointerType, getIconElement, getTempQuaternion, getTempVector, isMobileDevice, isQuest, serializable } from "@needle-tools/engine";
import { Quaternion, Spherical, Vector2, Vector3 } from "three";
import { Gyroscope } from "./Gyroscope";

const tempVec2_A = new Vector2();
const tempVec2_B = new Vector2();

enum GyroscopeMode {
    Disabled = 0,
    ControlledViaButton = 1,
    Enabled
}

enum AutoRotateMode {
    Disabled = 0,
    OnlyOnceOnStart = 1,
    Enabled = 2
}

export class PanoramaControls extends Behaviour {
    protected gyroscope: Gyroscope = new Gyroscope();

    protected spherical: Spherical = new Spherical();
    protected sphericalTarget: Spherical = new Spherical();

    protected gyroscopeQuaternion: Quaternion = new Quaternion();

    /* Input */

    @serializable()
    gyroscopeMode: GyroscopeMode = GyroscopeMode.Enabled;

    @serializable()
    pointerInput: boolean = true;

    /* Look */

    @serializable()
    rotateSpeed: number = 0.16;

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
    autoRotate: AutoRotateMode = AutoRotateMode.OnlyOnceOnStart;
    
    @serializable()
    autoRotateSpeed: number = 0.15;

    @serializable()
    autoRotateTimeout: number = 3;

    protected currentZoom: number = 0;

    protected initialQuaternion: Quaternion = new Quaternion();
    protected camera?: Camera;
    protected userInputStamp: number = Number.MIN_SAFE_INTEGER;

    start() {
        console.log(this);
        this.initialQuaternion.copy(this.gameObject.quaternion);
        this.camera = this.gameObject.getComponent(Camera)!;

        this.gyroscope.onFail.addEventListener(() => {
            this.dispatchEvent(new Event("onFail"));
        });

        this.currentZoom = Mathf.lerp(this.zoomMin, this.zoomMax, 0.5);
        if (this.camera) {
            this.currentZoom = this.camera.fieldOfView!;
        }

        switch (this.gyroscopeMode) {
            case GyroscopeMode.Disabled:
                this.shouldEnableGyro = false;
                break;
            case GyroscopeMode.ControlledViaButton:
                this.shouldEnableGyro = false;
                this.createGyroMenu();
                break;
            case GyroscopeMode.Enabled:
                this.shouldEnableGyro = true;
                break;
        }
    }

    protected initialTargetRotation?: Quaternion;
    protected lastGyro: Quaternion = new Quaternion();
    protected shouldEnableGyro: boolean = false;
    onBeforeRender() {
        if (this.gyroscope.isActive !== this.shouldEnableGyro) {
            if (this.shouldEnableGyro) this.gyroscope.activate()
            else this.gyroscope.deactivate();
        }

        if (this.pointerInput) {
            this.handleInput();
        }

        if (this.gyroscopeMode) {
            this.handleGyro();
        }

        if (this.enableZoom) {
            this.handleZoom();
        }

        if (this.autoRotate !== AutoRotateMode.Disabled) {
            this.handleAutoRotate();
        }

        this.applyRotation();
    }

    protected minPhi: number = (-Math.PI / 2) + (0.085);
    protected maxPhi: number = ( Math.PI / 2) - (0.085);
    protected applyRotation() {
        // clamp rotations
        this.spherical.phi = Mathf.clamp(this.spherical.phi, this.minPhi, this.maxPhi);
        this.sphericalTarget.phi = Mathf.clamp(this.sphericalTarget.phi, this.minPhi, this.maxPhi);
        
        // apply smoothing
        const dt = this.context.time.deltaTime;
        this.spherical.phi = Mathf.lerp(this.spherical.phi, this.sphericalTarget.phi, dt * this.rotateSmoothing);
        this.spherical.theta = Mathf.lerp(this.spherical.theta, this.sphericalTarget.theta, dt * this.rotateSmoothing);

        // create rotations
        const xRot = getTempQuaternion().setFromAxisAngle(getTempVector(1, 0, 0), this.spherical.phi);
        const yRot = getTempQuaternion().setFromAxisAngle(getTempVector(0, 1, 0), this.spherical.theta);

        // apply rotations
        this.gameObject.quaternion.copy(this.initialQuaternion).multiply(yRot).multiply(xRot);

        // add gyro rotation
        this.gameObject.quaternion.multiply(this.gyroscopeQuaternion);
    }
    
    protected hadRotatedOnce: boolean = false;
    protected isRotating: boolean = false;
    protected handleAutoRotate() {
        const time = this.context.time.time;
        const dt = this.context.time.deltaTime;
        const shouldRotate = time - this.userInputStamp > this.autoRotateTimeout;

        // is stopping to rotate
        if (!shouldRotate && this.isRotating) {
            this.hadRotatedOnce = true;
        }

        // rotating
        if (shouldRotate && (this.autoRotate === AutoRotateMode.OnlyOnceOnStart && !this.hadRotatedOnce)) {
            this.isRotating = true;
            this.currentZoom = Mathf.lerp(this.zoomMin, this.zoomMax, 0.5);
            this.sphericalTarget.theta += this.autoRotateSpeed * dt;
            this.sphericalTarget.phi = 0;
            this.isRotating = true;
        } // not rotating
        else {
            this.isRotating = false;
        }
    }

    protected pointerPositionLastFrame?: Vector3;
    protected handleInput() {        
        const input = this.context.input;
        
        if (input.getPointerPressedCount() == 1) {
            let projectedMouseDirection: Vector3 | undefined = undefined;
            if (this.camera) {
                const pos = input.getPointerPositionRC(0)!;
                
                const worldSpaceMousePos = getTempVector(pos.x, pos.y, -1).unproject(this.camera.cam);
                this.camera.gameObject.worldToLocal(worldSpaceMousePos);
                projectedMouseDirection = worldSpaceMousePos;
            }

            if (this.pointerPositionLastFrame && projectedMouseDirection) {
                const v1 = projectedMouseDirection;
                const v2 = this.pointerPositionLastFrame;

                const deltaX = this.getAngleBetweenVectors(getTempVector(v1.x, 0, v1.z).normalize(), getTempVector(v2.x, 0, v2.z).normalize(), getTempVector(1,0,0));
                const deltaY = this.getAngleBetweenVectors(getTempVector(0, v1.y, v1.z).normalize(), getTempVector(0, v2.y, v2.z).normalize(), getTempVector(0,-1,0));

                this.sphericalTarget.phi +=     2 * Math.PI * deltaY * this.rotateSpeed;
                this.sphericalTarget.theta +=   2 * Math.PI * deltaX * this.rotateSpeed;
            }

            this.pointerPositionLastFrame = projectedMouseDirection;
            this.userInputStamp = this.context.time.time;
        }
        else {
            this.pointerPositionLastFrame = undefined;
        }
    }

    protected getAngleBetweenVectors(v1: Vector3, v2: Vector3, up: Vector3): number {
        const sign = up.dot(v1) > up.dot(v2) ? 1 : -1;
        return v1.angleTo(v2) * sign;
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
                //this.currentZoom = delta; // HACK: bypass zoom smooting for pinch
            }
            this.previousPinchDistance = pinchDistance;
        }
        else 
            this.previousPinchDistance = undefined;

        return delta;
    }

    setGyroscope(state: boolean) {
        this.shouldEnableGyro = state;
    }

    protected createGyroMenu() {
        const btn = document.createElement("button");

        btn.innerText = "Gyroscope";
        const icon = getIconElement("sync");
        btn.prepend(icon);
        btn.title = "Click to toggle Gyroscope controls";

        const updateButtonIcon = () => {
            icon.innerText = this.shouldEnableGyro ? "sync_disabled" : "sync";
        }
        updateButtonIcon();

        btn.addEventListener("click", () => {
            this.setGyroscope(!this.shouldEnableGyro);
            if (this.shouldEnableGyro) this.gyroscope.activate();

            updateButtonIcon();
        });

        if (!isMobileDevice() || isQuest()) {
            btn.style.display = "none";
        } 

        this.context.menu.appendChild(btn);
    }
}