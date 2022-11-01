import { Behaviour, Collider, Collision, EventList, GameObject, serializeable } from "@needle-tools/engine";


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


export class PhysicsTrigger extends Behaviour {

    @serializeable(Collider)
    validColliders?:Collider[];

    @serializeable(EventList)
    onEnter?: EventList;

    @serializeable(EventList)
    onStay?: EventList;

    @serializeable(EventList)
    onExit?: EventList;

    onTriggerEnter(col: Collider) {
        if(this.validColliders && this.validColliders.length >= 0 && !this.validColliders?.includes(col)) return;
        this.onEnter?.invoke();
    }

    onTriggerStay(col: Collider) {
        if(this.validColliders && this.validColliders.length >= 0 && !this.validColliders?.includes(col)) return;
        this.onStay?.invoke();
    }

    onTriggerExit(col: Collider) {
        if(this.validColliders && this.validColliders.length >= 0 && !this.validColliders?.includes(col)) return;
        this.onExit?.invoke();
    }

}