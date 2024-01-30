import { Behaviour, Mathf, getTempVector, serializeable, showBalloonMessage } from "@needle-tools/engine";
import { Euler, MathUtils, Quaternion, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

export class SensorAccess extends Behaviour {

    @serializeable()
    public frequency: number = 60;

    @serializeable()
    invert: boolean = false;

    start() {
        const div = document.createElement("div");
        this.orientationLabel = document.createElement("p");
        const label2 = document.createElement("p");
        div.style.position = "absolute";
        div.style.left = "5px";
        div.style.top = "5px";

        label2.innerHTML = "<b>Pick up your phone!</b>";
        div.appendChild(label2);
        div.appendChild(this.orientationLabel);
        const btn = document.createElement("button");
        const defaultText = "Fullscreen";
        btn.innerText = defaultText;

        // check if the Fullscreen API is available and show a button if it is
        if ("requestFullscreen" in document.body) {
            btn.addEventListener("click", () => {
                if (window.matchMedia('(display-mode: fullscreen)').matches || document.fullscreenElement ) {
                    document.exitFullscreen();
                    btn.innerText = defaultText;
                } else { 
                    this.context.domElement.requestFullscreen();

                    // in fullscreen, we can lock device orientation on some devices
                    if ("orientation" in screen && "lock" in screen.orientation) {
                        try {
                            //@ts-ignore
                            screen.orientation.lock("portrait-primary");
                        }
                        catch (e) {
                            console.warn("Could not lock screen orientation.");
                        }
                    }
                    btn.innerText = "Exit";
                }
            });
        }
        else {
            btn.style.display = "none";
        }

        div.appendChild(btn);
        this.context.domElement.appendChild(div);
        
        const euler = new Euler();

        try {
            // try creating a sensor object, will throw if not available
            //@ts-ignore 
            const sensor = new RelativeOrientationSensor({frequency: this.frequency});

            Promise.all([
                //@ts-ignore
                navigator.permissions.query({ name: "accelerometer" }),
                //@ts-ignore
                navigator.permissions.query({ name: "gyroscope" })])
                .then((results) => {
                    if (results.every((result) => result.state === "granted"))
                    {
                        // attach to the sensor and apply to our object
                        sensor.addEventListener('reading', (e) => {
                            this.gameObject.quaternion.fromArray(sensor.quaternion).invert();
                            euler.setFromQuaternion(this.gameObject.quaternion);
                            euler.z += Math.PI / 2; // related to phone orientation - portrait
                            this.gameObject.quaternion.setFromEuler(euler);
                            this.setOrientationLabel();
                        });

                        // Handle runtime errors.
                        sensor.addEventListener('error', (e) => {
                            if (e.error.name === 'NotAllowedError') {
                                this.orientationLabel.innerText = 'Permission to access sensor was denied.';
                            } else if (e.error.name === 'NotReadableError') {
                                this.orientationLabel.innerText = 'Cannot connect to the sensor.';
                            } else
                            this.orientationLabel.innerText = `RelativeOrientationSensor error: ${e.error.name}`;
                        });

                        sensor.start();
                    } else {
                        this.orientationLabel.innerText = "No permissions to use RelativeOrientationSensor.";
                    }
            });
        }
        // Handle construction errors.
        catch (error) {
            if (error.name === 'SecurityError') {
                this.orientationLabel.innerText = 'Sensor construction was blocked by the Permissions Policy.';
            } else if (error.name === 'ReferenceError') {
                this.orientationLabel.innerText = 'Sensor is not supported by the User Agent.';
            } else {
                this.orientationLabel.innerText = error;
            }

            // fallback when the Sensor API doesn't exist
            if ("DeviceMotionEvent" in globalThis)
            {
                this.orientationLabel.innerText = "Click anywhere to enable orientation data.";

                let haveCheckedPermissions = false;
                this.context.domElement.addEventListener("click", () => {
                    if (haveCheckedPermissions) return;
                    haveCheckedPermissions = true;

                    this.deviceMotionFallback();
                });
            }
        }
    }

    private orientationLabel: HTMLParagraphElement;
    private euler: Euler = new Euler();
    private setOrientationLabel() {
        this.euler.setFromQuaternion(this.gameObject.quaternion);
        this.orientationLabel.innerText = `Orientation: ${this.log(this.euler.x)} ${this.log(this.euler.y)} ${this.log(this.euler.z)}`;
    }

    private log(x : number) : string {
        return MathUtils.radToDeg(x).toFixed(2) + "°";
    }

    private connectDeviceMotionEvents() {
        window.addEventListener('deviceorientation', (event) => {  
            if (!event.alpha || !event.beta || !event.gamma) return;

            // convert alpha, beta, gamma to radians
            const alpha = MathUtils.degToRad(event.alpha); //z
            const beta = MathUtils.degToRad(event.beta); //x
            const gamma = MathUtils.degToRad(event.gamma); //y

            // get orientation offset of the device (portrait/landscape)
            const deviceZAngle = this.getOrientation();

            //reset object
            this.gameObject.quaternion.set(0, 0, 0, 1); 

            // correct origin
            this.gameObject.rotateX(-Math.PI / 2); // rotate the origin to face forward (0,0,1)
            
            // apply gyro rotatinons (order is important)
            this.gameObject.rotateZ(alpha);
            this.gameObject.rotateX(beta);
            this.gameObject.rotateY(gamma);

            // compensate for device orientation offset (portrait/landscape)
            this.gameObject.rotateZ(MathUtils.degToRad(-deviceZAngle)); 

            if (this.invert)
                this.gameObject.quaternion.invert();

            this.setOrientationLabel();
        });
    }

    // https://gist.github.com/bellbind/d2be9cc09bf6241f255d
    private getOrientation = function () {
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

    private deviceMotionFallback() {
        //@ts-ignore
        if ("requestPermission" in DeviceMotionEvent) {
            //@ts-ignore
            DeviceMotionEvent.requestPermission().then(response => {
                if (response == 'granted') {
                    this.connectDeviceMotionEvents();
                }
            });
        }
        else {
            this.connectDeviceMotionEvents();
        }
    }
} 