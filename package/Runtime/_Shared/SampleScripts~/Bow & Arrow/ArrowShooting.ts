import { Animation, AssetReference, AudioSource, Behaviour, GameObject, Gizmos, IGameObject, Mathf, NEPointerEvent, NeedleXRController, NeedleXREventArgs, NeedleXRSession, Rigidbody, WebXR, XRControllerFollow, delay, delayForFrames, getParam, getTempQuaternion, getTempVector, isQuest, lookAtInverse, serializable } from "@needle-tools/engine";
import { AnimationAction, AnimationClip, AnimationMixer, Object3D, Vector3, Vector2, Quaternion } from "three";
import { AssetReference, AudioSource, Behaviour, GameObject, Gizmos, IGameObject, Mathf, NEPointerEvent, NeedleXRController, NeedleXREventArgs, NeedleXRSession, Rigidbody, XRControllerFollow, delay, delayForFrames, getParam, getTempQuaternion, getTempVector, isQuest, lookAtInverse, serializable } from "@needle-tools/engine";
import { AnimationAction, AnimationClip, AnimationMixer, Object3D, Vector3, Quaternion, Matrix4 } from "three";


const debug = getParam("debugarrow");

export class ArrowShooting extends Behaviour {
    @serializable(AssetReference)
    arrowPrefab?: AssetReference;

    @serializable(AudioSource)
    sound?: AudioSource;

    @serializable(Object3D)
    mountedParent?: Object3D;

    @serializable(Object3D)
    arrowOrigin?: Object3D;

    private nonMountedParent?: Object3D;
    awake(): void {
        if (this.arrowPrefab?.asset) {
            this.arrowPrefab.asset.visible = false;
        }
        if (this.bowObject) {
            this._initRot.copy(this.bowObject.quaternion);
        }

        // set a non mounted parent ref
        this.nonMountedParent = this.gameObject.parent!;

        this.mount();
    }

    /** true while aiming */
    private _isAiming = false;
    /** id of aiming pointer */
    private _aimingPointerId: number | undefined;
    /** start pos of aiming pointer */
    private _aimingPointerStartPos: Vector2 | undefined;
    /** the controller index holding the bow */
    private _bowController?: number = undefined;
    /** the controller index dragging the string */
    private _stringController?: number = undefined;

    onEnable(): void {
        this.arrowPrefab?.loadAssetAsync();
        this._isAiming = false;
        this.context.input.addEventListener("pointerdown", this.onDown);
        this.context.input.addEventListener("pointerup", this.onRelease);
    }

    onDisable(): void {
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
        else {
            if (evt.button === 0) {
                this._isAiming = true;
                this._aimingPointerId = evt.pointerId;

                const pos = new Vector2();
                pos.copy(this.context.input.getPointerPosition(evt.pointerId)!);
                this._aimingPointerStartPos = pos;
            }
        }
    }

    protected onRelease = (evt: NEPointerEvent) => {
        if (evt.button !== 0) {
            return;
        }
        this._isAiming = false;
        this._aimingPointerId = undefined;
        if (evt.origin instanceof NeedleXRController) {
            const ctrl = evt.origin;
            if (ctrl.index === this._stringController && this._bowController !== undefined) {
                const other = NeedleXRSession.active?.getController(this._bowController);
                if (ctrl && other) {
                    const point = ctrl.gripWorldPosition;
                    if (point) {
                        const dir = other.gripWorldPosition.clone().sub(point);
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
        else {
            if (this.arrowOrigin) {
                const pos = this.arrowOrigin.getWorldPosition(getTempVector());
                const dir = this.gameObject.getWorldDirection(getTempVector());
                this.shoot(pos, dir);
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

    /** Mounting */

    mount() {
        // start in mounted state
        if (this.mountedParent) {
            this.gameObject.parent = this.mountedParent;
            this.gameObject.position.set(0, 0, 0);
            this.gameObject.quaternion.set(0, 0, 0, 1);
        }
    }

    unmount() {
        this.gameObject.parent = this.nonMountedParent!;
    }



    /** Visuals */

    // TODO: report UnityGLTF failing when the anim is referenced on other
    // gameobject then the one hosting this animation
    /* @serializable(AnimationClip)
    bowAnimation?: AnimationClip; */

    @serializable(Animation)
    animationComponent?: Animation;

    @serializable(Object3D)
    bowObject?: GameObject;

    @serializable()
    mountedPreDrawAmount: number = 0.7;

    @serializable()
    fullDrawDragDistance: number = 100;

    private _initRot: Quaternion = new Quaternion();
    private _tempLookMatrix = new Matrix4();
    private _tempLookRot = new Quaternion();
    private _rotate90 = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
    private _mixer?: AnimationMixer;
    private _animation!: AnimationAction;

    private get _hasControllers(): boolean { return (this.context.xr?.controllers.length ?? 0) > 0; }

    onEnterXR(_args: NeedleXREventArgs): void {
        if (_args.xr.isVR) {
            // unmount
            if (this.mountedParent) {
                this.gameObject.parent = this.mountedParent;
            }
        }
    }

    onLeaveXR(_args: NeedleXREventArgs): void {
        // mount
        this.gameObject.parent = this.mountedParent!;
    }

    private tempDir: Vector2 = new Vector2();
    private tempUpRef: Vector2 = new Vector2();
    onBeforeRender(): void {
        if (!this.animationComponent || !this.bowObject) return;

        // animation driving setup
        if (!this._mixer) {
            this._mixer = new AnimationMixer(this.bowObject);
            const anim = this.animationComponent.animations.at(0);
            if (anim)
                this._animation = this._mixer.clipAction(anim);
        }

        const animGoalSmoothing = .1;
        let animTimeGoal = 0;
    
        // VR Logic
        if (this._hasControllers) {
            if (!this._isAiming) {
                animTimeGoal = 0;
            }
            else if (this.context.xr && this.context.xr.controllers.length > 1) {
                const holdingString = this.context.xr.controllers[this._stringController];
                const holdingBow = this.context.xr.controllers[1 - this._stringController];
    
                let dir = getTempVector(holdingBow.rayWorldPosition).sub(holdingString.rayWorldPosition)
    
                const lookRotation = getTempQuaternion().setFromUnitVectors(getTempVector(0, 0, 1), dir.normalize());
                this.bowObject.worldQuaternion = lookRotation.multiply(this._initRot);
    
                const dist = holdingString.object.worldPosition.distanceTo(holdingBow.object.worldPosition);
                animTimeGoal = Mathf.clamp01(dist * 1.5);
            }
        }
        // Non-VR Logic
        else {
            if (!this._isAiming) {
                animTimeGoal = this.mountedPreDrawAmount;
            }
            else {
                const input = this.context.input;

                if (this._aimingPointerStartPos != undefined && this._aimingPointerId != undefined) {
                    const from = this._aimingPointerStartPos;
                    const to = input.getPointerPosition(this._aimingPointerId)!;
                    const dir = this.tempDir.copy(to).sub(from);
                    const pixelDist = dir.length();
                    const dist = pixelDist;// / this.context.domHeight;

                    animTimeGoal = Mathf.clamp01(dist / this.fullDrawDragDistance);
                    

                    const dir3 = getTempVector();
                    dir3.x = dir.x;
                    dir3.z = dir.y;
                    dir3.normalize();

                    if (dist > 25) {
                        this.tempUpRef.set(1, 0);
                        const sign = this.tempUpRef.dot(dir) > 0 ? -1 : 1;

                        this.tempUpRef.set(0, 1);
                        const angle = this.tempUpRef.angleTo(dir) * sign;

                        console.log(angle);
                        
                        this.gameObject.quaternion.setFromAxisAngle(getTempVector().set(1, 0, 0), angle);
                    }
                }
            }
        }
        
        this._animation.timeScale = 0;
        const newT = Mathf.lerp(this._animation.time, animTimeGoal, this.context.time.deltaTime / animGoalSmoothing);
        const oldT = this._animation.time;
        this._animation.time = newT;

        if (Math.abs(newT - oldT) > Number.EPSILON)
        {
            this._animation.setEffectiveWeight(1);
            this._animation.play();
        }

        this._mixer.update(this.context.time.deltaTime);

        /* if (!this._isAiming) {
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

            let bowUp = getTempVector(0, 1, 0);
            if (!holdingBow.hand && holdingBow.targetRayMode === "tracked-pointer") {
                // if this is a controller, we rotate by 90° because Meta Browser...
                bowUp.applyQuaternion(this._rotate90);
            }
            bowUp.applyQuaternion(holdingBow.gripWorldQuaternion).normalize();

            this._tempLookMatrix.lookAt(holdingString.gripWorldPosition, holdingBow.gripWorldPosition, bowUp);
            this._tempLookRot.setFromRotationMatrix(this._tempLookMatrix);
            this.bowObject.worldQuaternion = this._tempLookRot;
            
            const dist = holdingString.object.worldPosition.distanceTo(holdingBow.object.worldPosition);
            this._animation.timeScale = 0;
            this._animation.time = Mathf.lerp(this._animation.time, Mathf.clamp01(dist * 1.5), this.context.time.deltaTime / .1);
            this._animation.setEffectiveWeight(1);
            this._animation.play();
        }
        this._mixer.update(this.context.time.deltaTime); */
    }
}