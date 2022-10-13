import { Behaviour } from "@needle-tools/engine";
import { Vector3 } from "three";
export class StartPosition extends Behaviour {

    startPosition?: Vector3;

    start() {
        this.startPosition = this.gameObject.position.clone();
    }

    resetToStart() {
        if (this.startPosition)
            this.gameObject.position.copy(this.startPosition);
    }
}