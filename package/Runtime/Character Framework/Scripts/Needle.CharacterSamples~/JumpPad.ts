import { Behaviour, EventList, ICollider, Rigidbody, serializable } from "@needle-tools/engine";
import { Vector3 } from "three";

export class JumpPad extends Behaviour {
    @serializable()
    force: number = 10;

    @serializable(Vector3)
    direction: Vector3 = new Vector3(0, 1, 0);

    @serializable(EventList)
    onJump: EventList = new EventList();

    /* @serializable()
    inheritYVelocity: boolean = true;

    @serializable()
    yVelocityMultiplier: number = 0.1; */
    awake(): void {
        this.direction.x *= -1; // flip X
    }

    private tempVector = new Vector3();
    onTriggerEnter(col: ICollider) {
        const rigidbody = col.gameObject?.getComponent(Rigidbody);
        if (rigidbody) {
            this.tempVector.copy(this.direction);
            this.tempVector.normalize();
            this.tempVector.applyQuaternion(this.worldQuaternion);

            this.tempVector.multiplyScalar(this.force * rigidbody.mass);

            /* if (this.inheritYVelocity) {
                const velocity = rigidbody.getVelocity();
                const boost = Mathf.clamp(-velocity.y * this.yVelocityMultiplier, 1, Number.MAX_SAFE_INTEGER);
                this.tempVector.multiplyScalar(boost);
            } */

            rigidbody.resetVelocities();
            rigidbody.applyImpulse(this.tempVector);

            this.onJump.invoke();
        }
    }
}