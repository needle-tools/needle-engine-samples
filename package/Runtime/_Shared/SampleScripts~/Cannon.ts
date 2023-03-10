import { AudioSource, Behaviour, Camera, GameObject, InstantiateOptions, Rigidbody, serializeable } from "@needle-tools/engine";
import { getWorldScale, setWorldPosition } from "@needle-tools/engine/src/engine/engine_three_utils";
import { Object3D, Vector3, Euler } from "three";


export class Cannon extends Behaviour {

    @serializeable(Object3D)
    prefab?: THREE.Object3D;

    @serializeable(AudioSource)
    audioSource?: AudioSource;

    private _instances: THREE.Object3D[] = [];
    private _index: number = -1;
    private _pointerRotation!: Euler;

    start() {
        if (this.prefab) GameObject.setActive(this.prefab, false);
        this._pointerRotation = new Euler();
    }

    update() {
        // todo: VR support
        if (this.context.input.getPointerClicked(0) && this.context.mainCameraComponent) {
            if (!this.prefab) return;

            const screenPoint = this.context.input.getPointerPositionRC(0)!;
            const comp = this.context.mainCameraComponent;

            const forward = comp.forward;
            const pos = comp.worldPosition;
            const start = pos.add(forward);

            // create a new instance from the prefab if we dont have enough yet
            // we cache previously created prefabs so we dont spawn infinite objects
            if (this._instances.length < 5) {
                const opts = new InstantiateOptions();
                opts.position = start;
                const prefabInstance = GameObject.instantiate(this.prefab, opts);
                if (!prefabInstance) return;
                this._instances.push(prefabInstance);
            }
            // get the next instance from the cache
            const i = ++this._index;
            const instance = this._instances[i % this._instances.length];
            // check the object exists
            if (!instance) return;

            // make sure the object is active
            GameObject.setActive(instance, true);

            this.audioSource?.stop();
            this.audioSource?.play();

            // set the object to the spawn position and apply the force
            start.sub(new Vector3(0, 0.3, 0));
            setWorldPosition(instance, start);
            const rigidbody = GameObject.getComponent(instance, Rigidbody);
            if (!rigidbody) return;

            const vel = new Vector3(0, 0, -1);
            if (!this.context.isInXR) { 
                this._pointerRotation.y = -screenPoint.x;
                this._pointerRotation.x = screenPoint.y;
                vel.applyEuler(this._pointerRotation);
            }
            
            vel.multiplyScalar(10);
            vel.applyQuaternion(comp.worldQuaternion);
            rigidbody.resetForcesAndTorques();
            rigidbody.resetVelocities();
            rigidbody?.applyImpulse(vel);
        }
    }
}
