import { AssetReference, AudioSource, Behaviour, GameObject, Gizmos, IGameObject, Mathf, NEPointerEvent, NeedleXRController, NeedleXREventArgs, NeedleXRSession, Rigidbody, XRControllerFollow, delay, delayForFrames, getParam, getTempQuaternion, getTempVector, isQuest, lookAtInverse, serializable } from "@needle-tools/engine";
import { AnimationAction, AnimationClip, AnimationMixer, Object3D, Vector3, Quaternion, Matrix4 } from "three";


const debug = getParam("debugarrow");

export class ArrowShooting extends Behaviour {


    @serializable(AssetReference)
    arrowPrefab?: AssetReference;

    @serializable(AudioSource)
    sound?: AudioSource;

    awake(): void {
        if (this.arrowPrefab?.asset) {
            this.arrowPrefab.asset.visible = false;
        }
        if (this.bowObject) {
            this._initRot.copy(this.bowObject.quaternion);
        }
    }

    /** true while aiming */
    private _isAiming = false;
    /** the controller index holding the bow */
    private _bowController?: number = undefined;
    /** the controller index dragging the string */
    private _stringController?: number = undefined;

    onEnterXR(_args: NeedleXREventArgs): void {
        this.arrowPrefab?.loadAssetAsync();
        this._isAiming = false;
        this.context.input.addEventListener("pointerdown", this.onDown);
        this.context.input.addEventListener("pointerup", this.onRelease);
    }
    onLeaveXR(_args: NeedleXREventArgs): void {
        this._isAiming = false;
        this.context.input.removeEventListener("pointerdown", this.onDown);
        this.context.input.removeEventListener("pointerup", this.onRelease);
    }

    protected onDown = (evt: NEPointerEvent) => {
        if (evt.origin instanceof NeedleXRController) {
            if (evt.button === 0) {
                this._isAiming = true;
                if (this._bowController === undefined)
                    this._bowController = evt.origin.index;
                else if (this._stringController === undefined)
                    this._stringController = evt.origin.index;

                const follow = this.bowObject?.getComponentInParent(XRControllerFollow);
                if (follow) follow.side = this._bowController;
            }
        }
    }

    protected onRelease = (evt: NEPointerEvent) => {
        if (evt.button !== 0) {
            return;
        }
        this._isAiming = false;
        if (evt.origin instanceof NeedleXRController) {
            const ctrl = evt.origin;
            if (ctrl.index === this._stringController) {
                const other = NeedleXRSession.active?.getController(this._bowController);
                if (ctrl && other) {
                    const point = ctrl.gripWorldPosition;
                    if (point) {
                        const dir = other.gripWorldPosition.clone().sub(point);
                        console.log("shoot", {mode: ctrl.targetRayMode, side: ctrl.side}, {mode: other.targetRayMode, side: other.side });
                        this.shoot(point, dir);
                        if (debug) Gizmos.DrawArrow(point, dir.clone().add(point), 0xffff00, 1);
                    }
                }
            }
            if (ctrl.index === this._bowController) {
                this._bowController = undefined;
            }
            if (ctrl.index === this._stringController) {
                this._stringController = undefined;
            }
        }
    }

    /**
     * shoot an arrow
     * @param from position to shoot from
     * @param vec direction to shoot (not normalized)
     */
    private async shoot(from: Vector3, vec: Vector3) {
        if (!this.arrowPrefab) return;
        const instance = await this.arrowPrefab.instantiate({ parent: this.context.scene });
        const force = Math.pow(vec.length() + .5, 2);
        const dir = vec.clone().normalize();
        if (instance) {
            instance.position.copy(from);
            instance.lookAt(dir.clone().add(from));
            instance.visible = true;
            const rb = instance.getOrAddComponent(Rigidbody);
            rb.isKinematic = false;
            rb.autoMass = false;
            rb.mass = .05;
            this.sound?.stop();
            this.sound?.play();
            // workaround Rigidbody not yet created in the physics engine (it gets created in onEnable)
            await delayForFrames(1);
            rb.applyImpulse(dir.multiplyScalar(force), true);
        }
    }




    /** Visuals */

    @serializable(AnimationClip)
    bowAnimation?: AnimationClip;

    @serializable(Object3D)
    bowObject?: GameObject;

    private _initRot: Quaternion = new Quaternion();
    private _tempLookMatrix = new Matrix4();
    private _tempLookRot = new Quaternion();
    private _mixer?: AnimationMixer;
    private _animation!: AnimationAction;

    onBeforeRender(): void {
        if (!this.bowAnimation || !this.bowObject) return;
        if (!this._mixer) {
            this._mixer = new AnimationMixer(this.bowObject);
            this._animation = this._mixer.clipAction(this.bowAnimation);
        }
        if (!this._isAiming) {
            this._animation.time = Mathf.lerp(this._animation.time, 0, this.context.time.deltaTime / .05);
        }
        else if (this.context.xr && this.context.xr.controllers.length > 1 && this._bowController !== undefined && this._stringController !== undefined) {
            const holdingString = this.context.xr.controllers[this._stringController];
            const holdingBow = this.context.xr.controllers[this._bowController];

            // This should not happen, but seems when transient pointers are in use we 
            // sometimes get invalid entries here
            if (!holdingString || !holdingBow) return;

            // TODO fix this, currently we're allowing all kinds of controllers here.
            // We should explicitly only allow hands and controllers, not transient inputs

            // console.log(holdingBow?.targetRayMode, holdingString?.targetRayMode);

            let dir = getTempVector(holdingBow.gripWorldPosition).sub(holdingString.gripWorldPosition)
            let bowUp = getTempVector(0, 1, 0).applyQuaternion(holdingBow.gripWorldQuaternion);
            this._tempLookMatrix.lookAt(holdingBow.gripWorldPosition, holdingString.gripWorldPosition, bowUp);
            this._tempLookRot.setFromRotationMatrix(this._tempLookMatrix);
            this.bowObject.worldQuaternion = this._tempLookRot.multiply(this._initRot);

            const dist = holdingString.object.worldPosition.distanceTo(holdingBow.object.worldPosition);
            this._animation.timeScale = 0;
            this._animation.time = Mathf.lerp(this._animation.time, Mathf.clamp01(dist * 1.5), this.context.time.deltaTime / .1);
            this._animation.setEffectiveWeight(1);
            this._animation.play();
        }
        this._mixer.update(this.context.time.deltaTime);
    }
}