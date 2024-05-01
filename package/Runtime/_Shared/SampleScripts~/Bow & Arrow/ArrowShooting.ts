import { Animation, AnimationCurve, AssetReference, AudioSource, Behaviour, Collider, GameObject, Gizmos, IGameObject, Mathf, NEPointerEvent, NeedleXRController, NeedleXREventArgs, NeedleXRSession, ParticleSystem, Rigidbody, RigidbodyConstraints, XRControllerFollow, delay, delayForFrames, getComponent, getParam, getTempQuaternion, getTempVector, serializable } from "@needle-tools/engine";
import { AnimationAction, AnimationMixer, Object3D, Vector3, Vector2, Quaternion, Matrix4 } from "three";
import { Arrow } from "./Arrow";


const debug = getParam("debugarrow");

export class ArrowShooting extends Behaviour {
    // STATS
    /** Power of the arrow when fully drawn */
    @serializable()
    power: number = 1.5;

    // VR
    /** How much physical distance is needed between controllers to match full draw */
    @serializable()
    drawMaxPhysicalDistance: number = 0.47269; // data from anim (-0.11326 - -0.58595)

    /** Distance between origin and string position when the bow is fully released */
    @serializable()
    drawMinPhysicalDistance: number = 0.1132593; // data from anim (-0.1132594)
    
    /** The shoot animation is not linear, this curve compensates that */
    @serializable(AnimationCurve)
    drawProgression?: AnimationCurve;

    // DESKTOP
    /** Where to mount the bow outside of VR */
    @serializable(Object3D)
    cameraParent?: Object3D;

    /** Drives the bow in a slightly drawned position when not interacting to give the user an intensive to drag and shoot */
    @serializable()
    desktopIdleDrawAmount: number = 0.25;

    /** Only count drags that are in this treshold from the interactionPixelOrigin */
    @serializable()
    interactionPixelTreshold: number = 85;

    /** Amount of pixel user needs to drag to draw the bow fully */
    @serializable()
    drawMaxPixelDistance: number = 100;

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
    private _aimingPointerStartPos: Vector2 = new Vector2(0, 0);
    /** the controller index holding the bow */
    private _bowController?: number = undefined;
    /** the controller index dragging the string */
    private _stringController?: number = undefined;

    async onEnable() {
        await this.arrowPrefab?.loadAssetAsync();
        this._isAiming = false;
        this.context.input.addEventListener("pointerdown", this.onDown);
        this.context.input.addEventListener("pointerup", this.onRelease);

        this.setupPreDraw();
    }

    onDisable(): void {
        this._isAiming = false;
        this.context.input.removeEventListener("pointerdown", this.onDown);
        this.context.input.removeEventListener("pointerup", this.onRelease);
    }

    protected onDown = (evt: NEPointerEvent) => {
        if (evt.origin instanceof NeedleXRController) {
            if (evt.button === 0) {
                if (this._bowController === undefined)
                    this._bowController = evt.origin.index;
                else if (this._stringController === undefined) {
                    this._stringController = evt.origin.index;
                }

                if (this._bowController === this._stringController)
                    this._stringController = undefined;

                const follow = this.bowObject?.getComponentInParent(XRControllerFollow);
                if (follow) follow.side = this._bowController;

                this._isAiming = this._stringController !== undefined;
            }
        } 
        else {
            if (evt.button === 0) {
                this._isAiming = true;
                this._aimingPointerId = evt.pointerId;
                this._aimingPointerStartPos.copy(this.context.input.getPointerPosition(evt.pointerId)!);
            }
        }
    }

    protected onRelease = (evt: NEPointerEvent) => {
        if (evt.button !== 0) {
            return;
        }

        // don't shoot when not previously aiming
        if (!this._isAiming) return;

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

                        let dist = other.object.worldPosition.distanceTo(ctrl.object.worldPosition);
                        dist -= this.drawMinPhysicalDistance;
                        const t = Mathf.clamp01(dist / this.drawMaxPhysicalDistance);

                        dir.normalize().multiplyScalar(t * this.power);
                        
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
            if (this.arrowSpawnSpot) {
                const pos = this.arrowSpawnSpot.getWorldPosition(getTempVector());
                const dir = this.gameObject.getWorldDirection(getTempVector());

                const distnace = this.getPointerDinstanceTo(this._aimingPointerStartPos, evt.pointerId);
                const power = Mathf.clamp01(distnace / this.drawMaxPixelDistance) * this.power;
                dir.multiplyScalar(power);

                if (distnace > this.interactionPixelTreshold)
                    this.shoot(pos, dir);
            }
        }
    }

    private getPointerDinstanceTo(from: Vector2, pointerId: number): number {
        const to = this.context.input.getPointerPosition(pointerId)!;
        return from.distanceTo(to);
    }

    private fakeArrow?: IGameObject;
    private async setupPreDraw() {
        if (!this.arrowPrefab || !this.arrowSpawnSpot) return;

        // don't predraw if already predrawed
        if (this.fakeArrow) return;

        const instance = await this.arrowPrefab.instantiate({ parent: this.arrowSpawnSpot });
        
        if (instance) {
            instance.visible = true;
            instance.worldScale = getTempVector(1,1,1);
            this.fakeArrow = instance;

            instance.getComponent(Arrow)?.destroy();
            instance.getComponent(Rigidbody)?.destroy();
            instance.getComponentInChildren(ParticleSystem)?.destroy();
            instance.getComponentsInChildren(Collider)
                    .forEach(c => c.destroy());
        }
    }

    private shotStamp = Number.MIN_SAFE_INTEGER;
    /**
     * shoot an arrow
     * @param from position to shoot from
     * @param vec direction to shoot (not normalized)
     */
    private async shoot(from: Vector3, vec: Vector3) {
        if (!this.arrowPrefab) return;
        
        this.shotStamp = this.context.time.time;

        const pos = from.clone();
        const lookGoal = pos.clone().add(vec);
        const force = Math.pow(vec.length() + .5, 2);
        const dir = vec.clone().normalize();

        const instance = await this.arrowPrefab.instantiate({ parent: this.context.scene });

        if (!instance) {
            console.error("Failed to instantiate arrow prefab");
            return;
        }

        instance.worldPosition = pos;
        instance.lookAt(lookGoal);
        instance.visible = true;

        const rb = instance.getComponent(Rigidbody)!;
        if (rb) {
            rb.isKinematic = false;
            rb.autoMass = false;
            rb.drag = .1;
            rb.mass = .1;
            rb.gravityScale = 0.4;
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
        if (this.cameraParent) {
            this.gameObject.parent = this.cameraParent;
            this.gameObject.position.set(0, 0, 0);
            this.gameObject.quaternion.set(0, 0, 0, 1);
        }
    }

    unmount() {
        this.gameObject.parent = this.nonMountedParent!;
    }



    /** Visuals and effects */


    @serializable(Object3D)
    bowObject?: GameObject;
    
    @serializable(Animation)
    animationComponent?: Animation;

    @serializable(AssetReference)
    arrowPrefab?: AssetReference;

    @serializable(Object3D)
    arrowSpawnSpot?: Object3D;

    @serializable(AudioSource)
    sound?: AudioSource;

    /** After firing the fake arrow is hidden and is popped back after this delay */
    @serializable()
    fakeArrowRespawnDuration: number = 0.3;

    private _initRot: Quaternion = new Quaternion();
    private _tempLookMatrix = new Matrix4();
    private _tempLookRot = new Quaternion();
    private _rotate90 = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
    private _mixer?: AnimationMixer;
    private _animation!: AnimationAction;

    private get _hasControllers(): boolean { return (this.context.xr?.controllers.length ?? 0) > 0; }

    onEnterXR(_args: NeedleXREventArgs): void {
        if (_args.xr.isVR || _args.xr.isPassThrough) {
            this.unmount();
        }
    }

    onLeaveXR(_args: NeedleXREventArgs): void {
        this.mount();
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
                this.shotStamp = this.context.time.time; // hide the arrow
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
                
                let dist = holdingString.object.worldPosition.distanceTo(holdingBow.object.worldPosition);
                dist -= this.drawMinPhysicalDistance;
                animTimeGoal = Mathf.clamp01(dist / this.drawMaxPhysicalDistance);
            }    
            /*else if (this.context.xr && this.context.xr.controllers.length > 1) {
                const holdingString = this.context.xr.controllers[this._stringController];
                const holdingBow = this.context.xr.controllers[1 - this._stringController];
    
                let dir = getTempVector(holdingBow.rayWorldPosition).sub(holdingString.rayWorldPosition)
    
                const lookRotation = getTempQuaternion().setFromUnitVectors(getTempVector(0, 0, 1), dir.normalize());
                this.bowObject.worldQuaternion = lookRotation.multiply(this._initRot);
    
                const dist = holdingString.object.worldPosition.distanceTo(holdingBow.object.worldPosition);
                animTimeGoal = Mathf.clamp01(dist * 1.5);
            } */
        }
        // Non-VR Logic
        else {
            // default when not aming or if no pointer
            animTimeGoal = this.desktopIdleDrawAmount;

            if (this._isAiming) {
                const input = this.context.input;

                if (this._aimingPointerId != undefined) {
                    const from = this._aimingPointerStartPos;
                    const to = input.getPointerPosition(this._aimingPointerId)!;
                    const dir = this.tempDir.copy(to).sub(from);
                    const pixelDist = dir.length();
                    const dist = pixelDist;// / this.context.domHeight;

                    const dir3 = getTempVector();
                    dir3.x = dir.x;
                    dir3.z = dir.y;
                    dir3.normalize();

                    const objDir3 = this.gameObject.getWorldDirection(getTempVector());
                    objDir3.y = 0;
                    objDir3.normalize();

                    const dirDiffDot = dir3.dot(objDir3); 

                    const applyRot = dist > this.interactionPixelTreshold;
                    const applyDraw = dirDiffDot > 0 || applyRot;

                    if (applyDraw) {
                        animTimeGoal = Mathf.clamp01(dist / this.drawMaxPixelDistance);
                        animTimeGoal = Mathf.remap(animTimeGoal, 0, 1, this.desktopIdleDrawAmount, 1);
                    }

                    this.tempUpRef.set(1, 0);
                    const sign = this.tempUpRef.dot(dir) > 0 ? -1 : 1;

                    this.tempUpRef.set(0, 1);
                    const angle = this.tempUpRef.angleTo(dir) * sign;

                    if (applyRot) {
                        const goal = getTempQuaternion().setFromAxisAngle(getTempVector().set(1, 0, 0), angle);

                        this.gameObject.quaternion.slerp(goal, this.context.time.deltaTime / .05);
                    }
                }
            }
        }

        // apply draw curve
        if (this.drawProgression) {
            animTimeGoal = this.drawProgression.evaluate(animTimeGoal);
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

        if (this.fakeArrow) {
            let t = (this.context.time.time - this.shotStamp) / this.fakeArrowRespawnDuration;
            t = this.easeInOutSine(Mathf.clamp01(t));
            this.fakeArrow.worldScale = getTempVector(1, 1, 1).multiplyScalar(t);
        }
    }

    // Cubic Bezier easing function
    private easeInOutSine(t: number): number {
        return Mathf.clamp01(-0.5 * (Math.cos(Math.PI * t) - 1));
    }
}