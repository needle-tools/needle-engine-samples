import { Behaviour, serializable } from "@needle-tools/engine";
import { Euler, MathUtils } from "three";
import { OrientationSensor, DeviceMotion } from "./GyroscopeControls";

// Documentation → https://docs.needle.tools/scripting

export class SensorAccessSample extends Behaviour {
    @serializable()
    invert: boolean = false;

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

        this.context.domElement.appendChild(div);

        this.sensorOrientation = new OrientationSensor(this.gameObject);
        this.deviceOrientation = new DeviceMotion(this.gameObject);

        this.sensorOrientation.initialize(() => {
            this.orientationLabel.innerText = "Click anywhere to enable orientation data.";
            this.deviceOrientation.initialize(() => {
                this.orientationLabel.innerText = "No API available.";
            }, this.invert);
        }, this.invert);
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
