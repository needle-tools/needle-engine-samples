import { Behaviour, Collider, GameObject, Rigidbody, serializeable } from "@needle-tools/engine";
import { Vector3 } from "three";

export class StartPosition extends Behaviour {

    //@nonSerialized
    startPosition?: Vector3;


    start() {
        this.startPosition = this.gameObject.position.clone();
    }

    resetToStart() {
        if (!this.startPosition) return;
        this.gameObject.position.copy(this.startPosition);
        const rb = GameObject.getComponent(this.gameObject, Rigidbody);
        rb?.setVelocity(0, 0, 0);
        rb?.setTorque(0, 0, 0);
    }
}


export class AutoReset extends StartPosition {

    @serializeable(Collider)
    worldCollider?: Collider;

    start(){
        super.start();
        if(!this.worldCollider) console.warn("Missing collider to reset", this);
    }
    
    onTriggerExit(col) {
        if(col === this.worldCollider){
            this.resetToStart();
        }
    }
}