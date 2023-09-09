import { Behaviour } from "@needle-tools/engine";
import { Mathf } from "@needle-tools/engine";
import { Object3D } from "three";


export class MouseRotation extends Behaviour {

    private targetRotation: number = 0;

    maxRotation: number = .1;

    update() {
        const rc = this.context.input.getPointerPositionRC(0);
        if (!rc) return;
        this.targetRotation = rc.x * this.maxRotation;
        (this.gameObject as Object3D).rotation.y = Mathf.lerp((this.gameObject as Object3D).rotation.y, this.targetRotation, this.context.time.deltaTime);
    }

}
