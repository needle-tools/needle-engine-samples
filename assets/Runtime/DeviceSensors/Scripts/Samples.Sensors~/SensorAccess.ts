import { Behaviour, serializeable } from "@needle-tools/engine";
import { Euler, MathUtils } from "three";

// Documentation → https://docs.needle.tools/scripting

export class SensorAccess extends Behaviour {

    @serializeable()
    public frequency: number = 60;

    private log(x : number) : string {
        return MathUtils.radToDeg(x).toFixed(2) + "°";
    }

    start() {
        // this.showAllSensors();

        const div = document.createElement("div");
        const label = document.createElement("p");
        const label2 = document.createElement("p");
        div.style.position = "absolute";
        div.style.left = "5px";
        div.style.top = "5px";

        label2.innerHTML = "<b>Pick up your phone!</b>";
        div.appendChild(label2);
        div.appendChild(label);
        const btn = document.createElement("button");
        btn.innerText = "Lock Phone Orientation";

        btn.addEventListener("click", () => {
            if (window.matchMedia('(display-mode: fullscreen)').matches || document.fullscreenElement ) {
                document.exitFullscreen();
                btn.innerText = "Lock Phone Orientation";
            } else { 
                this.context.domElement.requestFullscreen();

                if ("orientation" in screen && "lock" in screen.orientation) {
                    try {
                        screen.orientation.lock("portrait-primary");
                    }
                    catch (e) {
                        console.warn("Could not lock screen orientation.");
                    }
                }
                btn.innerText = "Exit";
            }

            
        });
        div.appendChild(btn);
        this.context.domElement.appendChild(div);
        
        const euler = new Euler();

        try {
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
                        sensor.addEventListener('reading', (e) => {
                            this.gameObject.quaternion.fromArray(sensor.quaternion).invert();
                            euler.setFromQuaternion(this.gameObject.quaternion);
                            label.innerText = `Orientation: ${this.log(euler.x)} ${this.log(euler.y)} ${this.log(euler.z)}`;
                        });
                        sensor.addEventListener('error', (e) => {
                            // Handle runtime errors.
                            if (e.error.name === 'NotAllowedError') {
                                label.innerText = 'Permission to access sensor was denied.';
                            } else if (e.error.name === 'NotReadableError') {
                                label.innerText = 'Cannot connect to the sensor.';
                            } else
                                label.innerText = `RelativeOrientationSensor error: ${e.error.name}`;
                        });
                        sensor.start();
                    } else {
                        label.innerText = "No permissions to use RelativeOrientationSensor.";
                    }
            });
        }
        catch (error) {
            // Handle construction errors.
            if (error.name === 'SecurityError') {
                label.innerText = 'Sensor construction was blocked by the Permissions Policy.';
            } else if (error.name === 'ReferenceError') {
                label.innerText = 'Sensor is not supported by the User Agent.';
            } else {
                label.innerText = error;
            }
        }
    }
} 