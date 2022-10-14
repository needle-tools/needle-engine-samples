import { Behaviour, GameObject, Rigidbody } from "@needle-tools/engine";
import { Vector3 } from "three";

export class StartPosition extends Behaviour {

    startPosition?: Vector3;


    start() {
        this.startPosition = this.gameObject.position.clone();
    }

    resetToStart() {
        if (!this.startPosition) return;
        this.gameObject.position.copy(this.startPosition);
        const rb = GameObject.getComponent(this.gameObject, Rigidbody);
        if (rb) rb.setVelocity(0, 0, 0);
    }
}