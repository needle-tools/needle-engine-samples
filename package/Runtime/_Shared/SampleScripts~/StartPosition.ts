// START MARKER Auto Reset
import { Behaviour, Collider, GameObject, Rigidbody, serializeable } from "@needle-tools/engine";
import { Vector3 } from "three";

export class StartPosition extends Behaviour {

    //@nonSerialized
    startPosition?: Vector3;

    start() {
        this.updateStartPosition();
    }

    updateStartPosition(){
        this.startPosition = this.gameObject.position.clone();
    }

    resetToStart() {
        if (!this.startPosition) return;
        const rb = GameObject.getComponent(this.gameObject, Rigidbody);
        rb?.teleport(this.startPosition);
    }
}

/** Reset to start position when object is exiting the collider */
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
// END MARKER Auto Reset