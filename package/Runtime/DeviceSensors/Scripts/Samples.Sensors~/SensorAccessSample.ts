import { Behaviour } from "@needle-tools/engine";
import { Euler, MathUtils } from "three";
import { OrientationSensor, DeviceMotion } from "./GyroscopeControls";

// Documentation → https://docs.needle.tools/scripting

export class SensorAccessSample extends Behaviour {
    private sensorOrientation!: OrientationSensor;
    private deviceOrientation!: DeviceMotion;

    private orientationLabel!: HTMLParagraphElement;

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
                if (window.matchMedia('(display-mode: fullscreen)').matches || document.fullscreenElement) {
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

        this.sensorOrientation = new OrientationSensor(this.gameObject);
        this.deviceOrientation = new DeviceMotion(this.gameObject);

        this.sensorOrientation.initialize(() => {
            this.orientationLabel.innerText = "Click anywhere to enable orientation data.";
            this.deviceOrientation.initialize(() => {
                this.orientationLabel.innerText = "No API available.";
            });
        });
    }

    update(): void {
        if (this.sensorOrientation.isConnected || this.deviceOrientation.isConnected)
            this.setOrientationLabel();
    }

    private euler: Euler = new Euler();
    private setOrientationLabel() {
        const num = (x: number) => MathUtils.radToDeg(x).toFixed(2) + "°";
        this.euler.setFromQuaternion(this.gameObject.quaternion);
        this.orientationLabel.innerText = `Orientation: ${num(this.euler.x)} ${num(this.euler.y)} ${num(this.euler.z)}`;
    }
}
