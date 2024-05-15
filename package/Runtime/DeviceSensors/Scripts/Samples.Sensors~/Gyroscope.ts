import { Context, EventList, Mathf, OrbitControls, getComponent, getParam, getTempQuaternion, getTempVector } from "@needle-tools/engine";
import { MathUtils, Quaternion } from "three";

const debug = getParam("debuggyro");

export class Gyroscope {
    // better refresh rate, but not supported on all devices (Android devices)
    protected sensorOrientation!: OrientationSensor;
    // worse refresh rate, but supported on majority of devices (iOS and Android)
    protected deviceOrientation!: DeviceMotion;

    onFial: EventList = new EventList();

    protected currentHandler: GyroscopeHandler | null = null;
    get handler(): GyroscopeHandler| null {
        return this.currentHandler;
    }

    get isConnected(): boolean { return this.handler?.isConnected || false; }

    get quaternion(): Quaternion | null { return this.handler?.quaternion || null; }
    getDelta(lastState: Quaternion): Quaternion | null{
        if (!this.quaternion) return null;

        tempQuaternion.copy(this.quaternion);
        tempQuaternion2.copy(lastState).invert();

        tempQuaternion2.multiply(tempQuaternion);

        return tempQuaternion2;
    }

    constructor() {
        this.sensorOrientation = new OrientationSensor();
        this.deviceOrientation = new DeviceMotion();
    }

    private _isActive: boolean = false;
    get isActive(): boolean { return this._isActive; }
    activate() {
        this._isActive = true;
        this.sensorOrientation.initialize(
            /* sensorOrientation success */
            () => {
                this.currentHandler = this.sensorOrientation;
            },
            /* sensorOrientation fail */
            (msg) => {
                if(debug) console.error("OrientationSensor: ", msg);
                this.deviceOrientation.initialize(
                    /* deviceOrientation success */
                    () => {
                        this.currentHandler = this.deviceOrientation;
                    },
                    /* deviceOrientation fail */
                    (msg) => {
                        if(debug) console.error("DeviceMotion: ", msg);
                        this.onFial.invoke({msg});
                        this._isActive = false;
                    }
                );
            }
        );
    
    }
    deactivate() {
        this._isActive = false;
        this.sensorOrientation.disconnect();
        this.deviceOrientation.disconnect();
    }
}

// https://gist.github.com/bellbind/d2be9cc09bf6241f255d
const getOrientation = function () {
    // W3C DeviceOrientation Event Specification (Draft)
    if (window.screen.orientation) return window.screen.orientation.angle;
    // Safari
    if (typeof window.orientation === "number") return window.orientation;
    // workaround for android firefox
    //@ts-ignore
    if (window.screen.mozOrientation) return {
        "portrait-primary": 0,
        "portrait-secondary": 180,
        "landscape-primary": 90,
        "landscape-secondary": 270,
    //@ts-ignore
    }[window.screen.mozOrientation];
    // otherwise
    return 0;
};

const tempQuaternion: Quaternion = new Quaternion();
const tempQuaternion2: Quaternion = new Quaternion();

abstract class GyroscopeHandler {
    isConnected: boolean = false;
    protected isInitialized: boolean = false;

    protected _quaternion: Quaternion = new Quaternion();
    get quaternion() { return this._quaternion; }

    /* protected _deltaQuaternion: Quaternion = new Quaternion();
    get deltaQuaternion() { return this._deltaQuaternion; } */

    connect() { 
        this.isConnected = true;
        this.isInitialized = true;
    }
    disconnect() { this.isConnected = false;}
    abstract initialize(onFail?: () => void): void;

    protected handleGyroscope(gyroQuaternion: Quaternion, assureRelative: boolean) {
        // rotate the origin to face forward (0,0,1)
        const fixedGyroQuaternion = getTempQuaternion().setFromAxisAngle(getTempVector(1,0,0), -Math.PI / 2);
        this._quaternion.copy(fixedGyroQuaternion.multiply(gyroQuaternion));

        // get orientation offset of the device (portrait/landscape)
        const deviceZAngle = getOrientation();
        const zQuat = getTempQuaternion().setFromAxisAngle(getTempVector(0, 0, -1), MathUtils.degToRad(deviceZAngle));
        this._quaternion.multiply(zQuat);

        // calculate relative gyro
        this._quaternion.copy(assureRelative ? this.applyGyroYRelativity(this._quaternion) : this._quaternion);
    }

    protected initialQuaternion?: Quaternion;
    protected applyGyroYRelativity(gyroQuaternion: Quaternion): Quaternion {
        // save initial quaternion
        if (!this.initialQuaternion) {
            this.initialQuaternion = new Quaternion().copy(gyroQuaternion);
        }

        // construct directions from the ref and current rotations
        const initDir = getTempVector(0, 0, 1).applyQuaternion(this.initialQuaternion);
        const currDir = getTempVector(0, 0, 1).applyQuaternion(gyroQuaternion);
        
        // ignore X rotation and get a direction delta that defines Y rotation delta
        initDir.y = 0;
        currDir.y = 0;
        initDir.normalize();
        currDir.normalize();

        // get Y angle
        let deltaYAngle = (2 * Math.PI) - initDir.angleTo(getTempVector(0, 0, 1));

        // sign
        const right = getTempVector(0, 1, 0);
        if (right.dot(initDir) < 0)
            deltaYAngle *= -1;

        const deltaQ = getTempQuaternion().setFromAxisAngle(getTempVector(0, 1, 0), deltaYAngle);

        return deltaQ.multiply(gyroQuaternion);
    }
}

/** Older API available both on iOS and Android */
export class DeviceMotion extends GyroscopeHandler {
    protected connectFromClick: boolean = false;

    constructor() {
        super();
        Context.Current.domElement.addEventListener("click", () => {
            this.tryConnectOnClick();
        });
    }

    connect() {
        super.connect();
        window.addEventListener('deviceorientation', this.deviceorientation);
    }

    disconnect() {
        super.disconnect();
        window.removeEventListener('deviceorientation', this.deviceorientation);
    }

    protected deviceorientation = (event: DeviceOrientationEvent) => {
        if (!event.alpha || !event.beta || !event.gamma) return;
        
        // convert alpha, beta, gamma to radians
        const alpha = MathUtils.degToRad(event.alpha); //z
        const beta = MathUtils.degToRad(event.beta); //x
        const gamma = MathUtils.degToRad(event.gamma); //y

        // apply gyro rotatinons (order is important)
        const zQuat = getTempQuaternion().setFromAxisAngle(getTempVector(0, 0, 1), alpha);
        const xQuat = getTempQuaternion().setFromAxisAngle(getTempVector(1, 0, 0), beta); 
        const yQuat = getTempQuaternion().setFromAxisAngle(getTempVector(0, 1, 0), gamma);

        const q = getTempQuaternion().set(0, 0, 0, 1);
        q.multiply(zQuat).multiply(xQuat).multiply(yQuat);
        //q.multiply(getTempQuaternion().setFromAxisAngle(getTempVector(0,0,1), -Math.PI)); // origin is facing downwards, rotate around Z to do 180 Y flip

        this.handleGyroscope(q, true);
    };

    initialize(onSucess?: () => void, onFail?: (msg: string) => void) {
        if (!("DeviceMotionEvent" in globalThis)) {
            onFail?.("DeviceMotionEvent not supported.");
        }
        else {
            onSucess?.();
        }
        
        this.connectFromClick = true;
        // awaiting user interaction -> tryConnectOnClick
    }

    protected tryConnectOnClick() {
        if (this.isConnected) return;
        if (!this.connectFromClick) return;

        //@ts-ignore
        if ("requestPermission" in DeviceMotionEvent) {
            //@ts-ignore
            DeviceMotionEvent.requestPermission().then(response => {
                if (response == 'granted') {
                    this.connect();
                }
            });
        }
        else {
            this.connect();
        }
    }
}

/** Usually accesible on Android */
export class OrientationSensor extends GyroscopeHandler {
    //@ts-ignore 
    protected sensor?: RelativeOrientationSensor;

    connect(): void {
        super.connect();
        this.sensor?.start();
    }
    disconnect(): void {
        super.disconnect();
        this.sensor?.stop();
    }

    initialize(onSucess?: () => void, onFail?: (msg: string) => void): void {
        if (this.isInitialized) {
            this.connect();
            return;
        }

        try {
            // try creating a sensor object, will throw if not available
            //@ts-ignore 
            this.sensor = new RelativeOrientationSensor({frequency: 60});

            // first register error events
            this.sensor.addEventListener('error', (e) => {
                if (e.error.name === 'NotAllowedError')
                    onFail?.('Permission to access sensor was denied.');
                else if (e.error.name === 'NotReadableError')
                    onFail?.('Cannot connect to the sensor.');
                else
                    onFail?.(`RelativeOrientationSensor error: ${e.error.name}`);
            });

            this.sensor.addEventListener('reading', (_e) => {
                if(this.sensor) {
                    const q = getTempQuaternion().fromArray(this.sensor.quaternion);
                    this.handleGyroscope(q, true);
                }
            });

            // then get permission and start the sensor
            Promise.all([
                //@ts-ignore
                navigator.permissions.query({ name: "accelerometer" }),
                //@ts-ignore
                navigator.permissions.query({ name: "gyroscope" })])
                .then((results) => {
                    if (results.every((result) => result.state === "granted")) {
                        this.connect();
                        onSucess?.();
                    }
                    else
                        onFail?.("No permissions to use RelativeOrientationSensor.");
                });
        }
        // Report construction errors.
        catch (error: unknown) {
            if (!(error instanceof Error)) return;
            this.disconnect();
            if (error.name === 'SecurityError') {
                onFail?.('Sensor construction was blocked by the Permissions Policy.');
            } else if (error.name === 'ReferenceError') {
                onFail?.('Sensor is not supported by the User Agent.');
            } else {
                onFail?.(error.message);
            }            
        }   
    }
}