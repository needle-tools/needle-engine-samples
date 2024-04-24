import { Behaviour, Context, getParam, getTempQuaternion, getTempVector, serializeable, showBalloonMessage } from "@needle-tools/engine";
import { Object3D, MathUtils, Quaternion } from "three";

const debug = getParam("debuggyro");

export class GyroscopeControls extends Behaviour {
    @serializeable()
    invert: boolean = false;

    // better refresh rate, but not supported on all devices (Android devices)
    protected sensorOrientation!: OrientationSensor;
    // worse refresh rate, but supported on majority of devices (iOS and Android)
    protected deviceOrientation!: DeviceMotion;

    awake() {
        this.sensorOrientation = new OrientationSensor(this.gameObject);
        this.deviceOrientation = new DeviceMotion(this.gameObject);
    }

    onEnable() {
        this.sensorOrientation.initialize((msg) => {
            if(debug) console.error("OrientationSensor: ", msg);
            this.deviceOrientation.initialize((msg) => {
                if(debug) console.error("DeviceMotion: ", msg);
                this.onFail();
            }, this.invert);
        }, this.invert);
    
    }
    onDisable() {
        this.sensorOrientation.disconnect();
        this.deviceOrientation.disconnect();
    }

    private onFail() {
        this.dispatchEvent(new Event("onfail"));
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

abstract class GyroscopeHandler {
    isConnected: boolean = false;
    protected isInitialized: boolean = false;

    protected _quaternion: Quaternion = new Quaternion();
    get quaternion() { return this._quaternion; }

    invert: boolean = false;

    protected target: Object3D;
    constructor(target: Object3D) {
        this.target = target;
    }

    connect() { 
        this.isConnected = true;
        this.isInitialized = true;
    }
    disconnect() { this.isConnected = false;}
    abstract initialize(onFail?: () => void): void;

    protected initialTargetRotation?: Quaternion;
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
        
        // invert view
        if (this.invert)
            this._quaternion.invert();
        
        // apply to object if supplied
        if (this.target) {
            if (!this.initialTargetRotation) {
                this.initialTargetRotation = this.target.quaternion.clone();
            }
            
            this.target.quaternion.copy(this.initialTargetRotation);
            this.target.quaternion.multiply(this.quaternion);
        }
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
    invert: boolean = false;
    protected connectFromClick: boolean = false;

    constructor(target: Object3D) {
        super(target);

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

    initialize(onFail?: (msg: string) => void, invert: boolean = false) {
        this.invert = invert;
        if (!("DeviceMotionEvent" in globalThis)) {
            onFail?.("DeviceMotionEvent not supported.");
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
    invert: boolean = false;

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

    initialize(onFail?: (msg: string) => void, invert: boolean = false): void {
        this.invert = invert;

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
                    if (results.every((result) => result.state === "granted"))
                        this.connect();
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