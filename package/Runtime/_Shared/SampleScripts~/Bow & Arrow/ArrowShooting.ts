import { AssetReference, AudioSource, Behaviour, GameObject, Gizmos, IGameObject, Mathf, NEPointerEvent, NeedleXRController, NeedleXREventArgs, NeedleXRSession, Rigidbody, XRControllerFollow, delay, delayForFrames, getParam, getTempQuaternion, getTempVector, isQuest, lookAtInverse, serializable } from "@needle-tools/engine";
import { AnimationAction, AnimationClip, AnimationMixer, Object3D, Vector3 } from "three";


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
    }

    /** true while aiming */
    private _isAiming = false;
    /** the controller index dragging the string */
    private _stringController = 0;

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
                this._stringController = evt.origin.index;
                const follow = this.bowObject?.getComponentInParent(XRControllerFollow);
                if (follow) {
                    follow.side = evt.origin.side === "left" ? "right" : "left";
                }
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
            const other = NeedleXRSession.active?.controllers.find(c => c !== ctrl);
            if (ctrl && other) {
                const point = ctrl.rayWorldPosition;
                const dir = other.rayWorldPosition.clone().sub(point);
                this.shoot(point, dir);
                if (debug) Gizmos.DrawArrow(point, dir.clone().add(point), 0xffff00, 1);
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
        else if (this.context.xr) {
            const holdingString = this.context.xr.controllers[this._stringController];
            const holdingBow = this.context.xr.controllers[1 - this._stringController];

            let dir = getTempVector(holdingBow.rayWorldPosition).sub(holdingString.rayWorldPosition)

            const lookRotation = getTempQuaternion().setFromUnitVectors(getTempVector(0, 0, 1), dir.normalize());
            this.bowObject.worldQuaternion = lookRotation;

            const dist = holdingString.object.worldPosition.distanceTo(holdingBow.object.worldPosition);
            this._animation.timeScale = 0;
            this._animation.time = Mathf.lerp(this._animation.time, Mathf.clamp01(dist * 1.5), this.context.time.deltaTime / .1);
            this._animation.setEffectiveWeight(1);
            this._animation.play();
        }
        this._mixer.update(this.context.time.deltaTime);
    }
}