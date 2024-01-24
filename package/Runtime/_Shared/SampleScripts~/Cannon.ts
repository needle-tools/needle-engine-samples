import { AudioSource, Behaviour, GameObject, InstantiateOptions, NEPointerEvent, NeedleXREventArgs, PointerType, Rigidbody, WebXR, serializeable } from "@needle-tools/engine";
import { setWorldPosition } from "@needle-tools/engine";
import { Object3D, Vector3, Quaternion } from "three";

export class Cannon extends Behaviour {

    @serializeable(Object3D)
    prefab?: THREE.Object3D;

    @serializeable(AudioSource)
    audioSource?: AudioSource;

    @serializeable()
    strength: number = 10;

    @serializeable()
    maxInstances: number = 10;

    private _instances: THREE.Object3D[] = [];
    private _index: number = -1;
    private webXR?: WebXR;

    start() {
        if (this.prefab) GameObject.setActive(this.prefab, false);
        this.webXR ??= GameObject.findObjectOfType(WebXR)!;
    }
    onEnable(): void {
        this.context.input.addEventListener("pointerdown", this._onPointerDown);
    }
    onDisable(): void {
        this.context.input.removeEventListener("pointerdown", this._onPointerDown);
    }
    private _onPointerDown = (args: NEPointerEvent) => {
        if (args.button !== 0) return;
        this.throwBall(args.space.worldPosition, args.space.worldForward);
    }

    private tempOrigin = new Vector3();
    private tempDirection = new Vector3();
    private quat = new Quaternion();

    private throwFromTouchPos() {
        if (!this.context.mainCameraComponent) return;

        const camComp = this.context.mainCameraComponent!;

        if (!camComp) return;
        const input = this.context.input;

        // get relative mouse position, in range -1 to 1
        const mouse = input.mousePositionRC;

        // get world position of mouse on the near plane
        this.tempOrigin.set(mouse.x, mouse.y, -1).unproject(camComp.cam);

        // caulculate direction from camera to world mouse
        this.tempDirection.copy(this.tempOrigin).sub(camComp.worldPosition).normalize();

        // add little offset to spawn the ball in front of the camera and not in inside of it
        this.tempOrigin.addScaledVector(this.tempDirection, 2);

        this.quat.setFromUnitVectors(new Vector3(0, 0, -1), this.tempDirection);
        this.tempDirection.set(0, 0, -1);
        this.tempDirection.applyQuaternion(this.quat);

        this.throwBall(this.tempOrigin, this.tempDirection);
    }

    private throwBall(origin: Vector3, direction: Vector3) {
        if (!this.prefab) return;

        // create a new instance from the prefab if we dont have enough yet
        // we cache previously created prefabs so we dont spawn infinite objects
        if (this._instances.length < this.maxInstances) {
            const opts = new InstantiateOptions();
            opts.position = origin;
            const prefabInstance = GameObject.instantiate(this.prefab, opts);
            if (!prefabInstance) return;
            this._instances.push(prefabInstance);
        }

        // get the next instance from the cache
        const i = ++this._index;
        const instance = this._instances[i % this._instances.length];

        // check the object exists
        if (!instance) return;

        setWorldPosition(instance, origin);

        // make sure the object is active
        GameObject.setActive(instance, true);

        // play audio sfx
        this.audioSource?.stop();
        this.audioSource?.play();

        // Get rigidbody, reset previous motion and apply force
        const rigidbody = GameObject.getComponent(instance, Rigidbody);
        if (!rigidbody) return;

        direction.multiplyScalar(this.strength);
        rigidbody.resetForcesAndTorques();
        rigidbody.resetVelocities();
        rigidbody?.applyImpulse(direction);
    }
}
