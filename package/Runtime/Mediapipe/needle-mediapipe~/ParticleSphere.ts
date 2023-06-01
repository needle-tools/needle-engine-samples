import { Behaviour, Rigidbody } from "@needle-tools/engine";
import { Vector3 } from "three";


export class ParticleSphere extends Behaviour {

    private _targetPosition: Vector3 = new Vector3(0, 0, 0);
    private _lastUpdateTime: number = 0;
    private _rb?: Rigidbody;

    start() {
        this._rb = this.gameObject.getComponent(Rigidbody) as Rigidbody;
    }

    setTarget(x: number, y: number, z: number) {
        this._targetPosition.set(x, y, z);
        this._lastUpdateTime = this.context.time.time;
    }

    update() {
        if (this.context.time.time - this._lastUpdateTime > 1) {
            if (this._rb) this._rb.useGravity = true;
            return
        }
        if (this._rb) this._rb.useGravity = false;
        this.gameObject.position.lerp(this._targetPosition, this.context.time.deltaTime / .5);
    }
}