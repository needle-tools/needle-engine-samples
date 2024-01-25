import { Behaviour, Collision, Rigidbody, getTempQuaternion, getTempVector } from "@needle-tools/engine";



export class Arrow extends Behaviour {

    // get stuck when you hit something
    onCollisionEnter(col: Collision) {
        col.collider.attachedRigidbody!.isKinematic = true;
    }


    private _rigidbody?: Rigidbody;
    awake(): void {
        this._rigidbody = this.gameObject.getComponentInParent(Rigidbody) || undefined;
    }

    onBeforeRender(): void {
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