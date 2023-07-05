import { Behaviour, Collider, Collision, EventList, GameObject, serializeable } from "@needle-tools/engine";

// START MARKER Physics Collision Relay
export class PhysicsCollision extends Behaviour {

    @serializeable(EventList)
    onEnter?: EventList;

    @serializeable(EventList)
    onStay?: EventList;

    @serializeable(EventList)
    onExit?: EventList;

    @serializeable()
    logEvents: boolean = false;

    onCollisionEnter(col: Collision) {
        if (this.logEvents)
            console.log("ENTER", col);
        this.onEnter?.invoke(col);
    }

    onCollisionStay(col: Collision) {
        if (this.logEvents)
            console.log("STAY", col);
        this.onStay?.invoke(col);
    }

    onCollisionExit(col: Collision) {
        if (this.logEvents)
            console.log("EXIT", col);
        this.onExit?.invoke(col);
    }
}
// END MARKER Physics Collision Relay


// START MARKER Physics Trigger Relay
export class PhysicsTrigger extends Behaviour {

    @serializeable(GameObject)
    triggerObjects?:GameObject[];

    @serializeable(EventList)
    onEnter?: EventList;

    @serializeable(EventList)
    onStay?: EventList;

    @serializeable(EventList)
    onExit?: EventList;

    onTriggerEnter(col: Collider) {
        if(this.triggerObjects && this.triggerObjects.length > 0 && !this.triggerObjects?.includes(col.gameObject)) return;
        this.onEnter?.invoke();
    }

    onTriggerStay(col: Collider) {
        if(this.triggerObjects && this.triggerObjects.length > 0 && !this.triggerObjects?.includes(col.gameObject)) return;
        this.onStay?.invoke();
    }

    onTriggerExit(col: Collider) {
        if(this.triggerObjects && this.triggerObjects.length > 0 && !this.triggerObjects?.includes(col.gameObject)) return;
        this.onExit?.invoke();
    }
}
// END MARKER Physics Trigger Relay