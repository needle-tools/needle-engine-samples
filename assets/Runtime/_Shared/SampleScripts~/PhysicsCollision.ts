import { Behaviour, Collision, EventList, GameObject, serializeable } from "@needle-tools/engine";


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