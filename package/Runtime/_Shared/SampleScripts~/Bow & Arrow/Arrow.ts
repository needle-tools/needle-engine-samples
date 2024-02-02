import { Behaviour, Collider, Collision, GameObject, Rigidbody, getTempQuaternion, getTempVector } from "@needle-tools/engine";



export class Arrow extends Behaviour {

    destroyTarget: boolean = false;

    private _rigidbody?: Rigidbody;
    private _startTime = 0;

    awake(): void {
        this._rigidbody = this.gameObject.getComponentInParent(Rigidbody) || undefined;
        if (this._rigidbody) {
            const col = this.gameObject.getComponentsInChildren(Collider);
            for (const c of col) {
                const det = GameObject.addNewComponent(c.gameObject, ArrowCollisionDetection);
                det.rigidBody = this._rigidbody;
                det.arrow = this;
                det.destroyTarget = this.destroyTarget;
            }
        }
    }

    start(): void {
        this._startTime = this.context.time.time;
    }

    onBeforeRender(): void {
        if (this.context.time.time - this._startTime > 5) {
            this.gameObject.destroy();
            return;
        }
        // rotate towards rigidbody velocity
        if (this._rigidbody) {
            const vel = this._rigidbody.getVelocity();
            if (vel.lengthSq() > 0) {
                const targetRotation = getTempVector().set(vel.x, vel.y, vel.z).normalize();
                const tempQuat = getTempQuaternion();
                tempQuat.setFromUnitVectors(getTempVector(0, 0, 1), targetRotation);
                this.gameObject.quaternion.slerp(tempQuat, this.context.time.deltaTime / .1);
            }
        }
    }
}

class ArrowCollisionDetection extends Behaviour {

    arrow!: Arrow;
    rigidBody!: Rigidbody;
    destroyTarget: boolean = false;

    // get stuck when you hit something
    onCollisionEnter(col: Collision) {
        if (this.destroyTarget) {
            col.gameObject.destroy();
            this.arrow.gameObject.destroy();
        }
        else {
            col.gameObject.attach(this.arrow.gameObject);
            if (col.rigidBody instanceof Rigidbody) {
                col.rigidBody.applyImpulse(col.gameObject.position.clone().multiply(this.rigidBody.getVelocity()), true);
            }

            const colliders = this.rigidBody.gameObject.getComponentsInChildren(Collider);
            for (const c of colliders) {
                c.destroy();
            }
            this.rigidBody.destroy();
            this.arrow.destroy();
        }
    }

}