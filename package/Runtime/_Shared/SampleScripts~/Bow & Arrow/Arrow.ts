import { Behaviour, Collider, Collision, GameObject, Rigidbody, getTempQuaternion, getTempVector } from "@needle-tools/engine";



export class Arrow extends Behaviour {

    private _rigidbody?: Rigidbody;
    private _startTime = 0;

    awake(): void {
        this._rigidbody = this.gameObject.getComponentInParent(Rigidbody) || undefined;
        if (this._rigidbody) {
            const col = this.gameObject.getComponentsInChildren(Collider);
            for (const c of col) {
                const det = GameObject.addNewComponent(c.gameObject, ArrowCollisionDetection);
                det.rigidBody = this._rigidbody;
            }
        }
    }

    start(): void {
        this._startTime = this.context.time.time;
    }

    onBeforeRender(): void {
        if (this.context.time.time - this._startTime > 10) {
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
                this.gameObject.quaternion.slerp(tempQuat, this.context.time.deltaTime / .2);
            }
        }
    }
}

class ArrowCollisionDetection extends Behaviour {

    rigidBody!: Rigidbody;

    // get stuck when you hit something
    onCollisionEnter(_: Collision) {
        const col = this.rigidBody.gameObject.getComponentsInChildren(Collider);
        for (const c of col) {
            c.destroy();
        }
        this.rigidBody.destroy();
    }

}