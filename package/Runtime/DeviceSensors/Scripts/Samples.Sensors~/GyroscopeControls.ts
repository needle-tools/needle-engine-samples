import { Behaviour, Context, getParam, getTempQuaternion, serializeable } from "@needle-tools/engine";
import { Object3D, MathUtils } from "three";

const debug = getParam("debuggyro");

export class GyroscopeControls extends Behaviour {
    // better refresh rate, but not supported on all devices (supported on Android devices)
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
            });
        });
    
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
}

export class DeviceMotion extends GyroscopeHandler {

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

        // get orientation offset of the device (portrait/landscape)
        const deviceZAngle = getOrientation();

        //reset object
        this.target.quaternion.set(0, 0, 0, 1); 

        // correct origin
        this.target.rotateX(-Math.PI / 2); // rotate the origin to face forward (0,0,1)
        
        // apply gyro rotatinons (order is important)
        this.target.rotateZ(alpha);
        this.target.rotateX(beta);
        this.target.rotateY(gamma);

        // compensate for device orientation offset (portrait/landscape)
        this.target.rotateZ(MathUtils.degToRad(-deviceZAngle));
    };

    initialize(onFail?: (msg: string) => void) {
        if (!("DeviceMotionEvent" in globalThis)) {
            onFail?.("DeviceMotionEvent not supported.");
        }

        // awaiting user interaction -> tryConnectOnClick
    }

    protected tryConnectOnClick() {
        if (this.isConnected) return;

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

    initialize(onFail?: (msg: string) => void): void {
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
                // get orientation offset of the device (portrait/landscape)
                const deviceZAngle = getOrientation();

                //reset object
                this.target.quaternion.set(0, 0, 0, 1); 

                // correct origin
                this.target.rotateX(-Math.PI / 2); // rotate the origin to face forward (0,0,1)

                const quaternion = getTempQuaternion().fromArray(this.sensor!.quaternion);
                this.target.quaternion.multiply(quaternion);

                // compensate for device orientation offset (portrait/landscape)
                this.target.rotateZ(MathUtils.degToRad(-deviceZAngle));
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