import { Animation, AnimationCurve, AssetReference, AudioSource, Behaviour, Collider, GameObject, Gizmos, Mathf, NEPointerEvent, NeedleXRController, NeedleXRSession, ParticleSystem, Rigidbody, XRControllerFollow, delayForFrames, getParam, getTempVector, serializable } from "@needle-tools/engine";
import { AnimationAction, AnimationMixer, Object3D, Vector3, Vector2, Quaternion, Matrix4, Plane, Raycaster, Line3 } from "three";
import { Arrow } from "./Arrow";

const debug = getParam("debugarrow");

export class ArrowShooting extends Behaviour {

    @serializable(Object3D)
    bowObject!: GameObject;
    
    @serializable(Animation)
    animationComponent!: Animation;

    @serializable(AssetReference)
    arrowPrefab!: AssetReference;

    @serializable(Object3D)
    arrowSpawnSpot!: Object3D;

    /** Power of the arrow when fully drawn */
    @serializable()
    power: number = 1.5;

    /** The shoot animation is not linear, this curve compensates that */
    @serializable(AnimationCurve)
    drawProgression?: AnimationCurve;
    
    // These values are derived from the bow animation clip – they're used to match physical hand motion to bow draw animation.
    @serializable()
    drawMaxPhysicalDistance: number = 0.47269; // data from anim (0.58595 - 0.11326)
    @serializable()
    drawMinPhysicalDistance: number = 0.1132593; // data from anim (-0.1132594);

    @serializable(AudioSource)
    sound?: AudioSource;

    private get _hasControllers(): boolean { return (this.context.xr?.controllers.length ?? 0) > 0; }

    /** Visuals and effects */
    private _tempLookMatrix = new Matrix4();
    private _tempLookRot = new Quaternion();
    private _mixer?: AnimationMixer;
    private _animation!: AnimationAction;
    private _drawingArrow?: Object3D;
    private _lastShotTimestamp = Number.MIN_SAFE_INTEGER;

    private _isAiming = false;
    /** the controller index holding the bow */
    private _bowController?: number = undefined;
    /** the controller index dragging the string */
    private _stringPointerId: number | undefined;
    private _stringController?: number = undefined;
    /** the component that makes the bow follow the controller hand */
    private _controllerFollow: XRControllerFollow | null = null;
    private _aimingPointerStartPos: Vector3 = new Vector3();
    private _initialBowObjectRotation: Quaternion = new Quaternion();
    private _initialBowObjectPosition: Vector3 = new Vector3();
    /** For dragging on the screen outside XR */
    private _screenDragRaycaster: Raycaster = new Raycaster();
    private _screenDragPlane: Plane = new Plane();
    private _screenDragRayLine: Line3 = new Line3();

    awake(): void {
        if (this.arrowPrefab?.asset)
            this.arrowPrefab.asset.visible = false;
    }

    async onEnable() {
        await this.arrowPrefab?.loadAssetAsync();
        this._isAiming = false;
        this._controllerFollow = this.bowObject.getComponentInParent(XRControllerFollow) || null;
        
        this._initialBowObjectRotation = this.bowObject.quaternion.clone();
        this._initialBowObjectPosition = this.bowObject.position.clone();
        // slightly tilted upwards plane to drag on
        this._screenDragPlane.setFromNormalAndCoplanarPoint(getTempVector(0,1,-0.2), this.bowObject.worldPosition);
        
        this.context.input.addEventListener("pointerdown", this.onDown);
        this.context.input.addEventListener("pointerup", this.onRelease);

        this.setupArrowInstances();
    }

    onDisable(): void {
        this._isAiming = false;
        this.context.input.removeEventListener("pointerdown", this.onDown);
        this.context.input.removeEventListener("pointerup", this.onRelease);
    }

    protected onDown = (evt: NEPointerEvent) => {
        if (evt.origin instanceof NeedleXRController) {
            if (evt.button === 0) {
                if (this._bowController === undefined) {
                    this._bowController = evt.origin.index;
                    this.bowObject.quaternion.copy(this._initialBowObjectRotation);
                }
                else if (this._stringController === undefined) {
                    this._stringController = evt.origin.index;
                }

                if (this._bowController === this._stringController)
                    this._stringController = undefined;

                if (this._controllerFollow) {
                    this._controllerFollow.side = this._bowController;
                    this._controllerFollow.enabled = this._bowController !== undefined;
                }

                this._isAiming = this._stringController !== undefined;
            }
        } 
        else {
            if (evt.button === 0) {
                this._isAiming = true;
                this._stringPointerId = evt.pointerId;
                this.getScreenDragPoint(evt.pointerId, this._aimingPointerStartPos);
            }
        }
    }

    // Restore bow position and rotation when leaving XR
    onLeaveXR(): void {
        this.bowObject.quaternion.copy(this._initialBowObjectRotation);
        this.bowObject.position.copy(this._initialBowObjectPosition);
    }

    protected onRelease = (evt: NEPointerEvent) => {
        if (evt.button !== 0) return;

        if (evt.origin instanceof NeedleXRController) {
            const ctrl = evt.origin;
            if (this._isAiming && ctrl.index === this._stringController && ctrl.index !== this._bowController && typeof this._bowController == "number") {
                const other = NeedleXRSession.active?.getController(this._bowController);
                if (ctrl && other) {
                    const point = ctrl.gripWorldPosition;
                    if (point) {
                        const dir = other.gripWorldPosition.clone().sub(point);

                        let dist = other.object.worldPosition.distanceTo(ctrl.object.worldPosition);
                        dist -= this.drawMinPhysicalDistance;
                        const t = Mathf.clamp01(dist / this.drawMaxPhysicalDistance) * this.power;

                        dir.normalize().multiplyScalar(t);
                        
                        this.shoot(point, dir);
                        if (debug) Gizmos.DrawArrow(point, dir.clone().add(point), 0xffff00, 1);
                    }
                }
            }
            if (ctrl.index === this._bowController)
                this._bowController = undefined;
            if (ctrl.index === this._stringController)
                this._stringController = undefined;

            this._isAiming = this._bowController !== undefined && this._stringController !== undefined;
            if (this._controllerFollow)
                this._controllerFollow.enabled = this._bowController !== undefined;
        }
        else {

            const to = this._aimingPointerStartPos;
            const from = this.getScreenDragPoint(this._stringPointerId, getTempVector());

            const pos = this.arrowSpawnSpot.getWorldPosition(getTempVector());
            const dir = this.bowObject.getWorldDirection(getTempVector()).multiplyScalar(-1);

            const distance = to.distanceTo(from);
            const t = Mathf.clamp01(distance / this.drawMaxPhysicalDistance) * this.power;
            dir.normalize().multiplyScalar(t);
            this.shoot(pos, dir);
        }

        this._stringPointerId = undefined;
    }

    private getPointerDistanceTo(from: Vector2, pointerId: number): number {
        const to = this.context.input.getPointerPosition(pointerId)!;
        return from.distanceTo(to);
    }

    private async setupArrowInstances() {
        if (!this.arrowPrefab || !this.arrowSpawnSpot) return;

        // don't predraw if already predrawed
        if (this._drawingArrow) return;

        const instance = await this.arrowPrefab.instantiate({ parent: this.arrowSpawnSpot });
        
        if (instance) {
            instance.visible = true;
            instance.worldScale = getTempVector(1,1,1);
            this._drawingArrow = instance;

            // remove interactive components from the visual instance for drawing the arrow
            instance.getComponent(Arrow)?.destroy();
            instance.getComponent(Rigidbody)?.destroy();
            instance.getComponentInChildren(ParticleSystem)?.destroy();
            instance.getComponentsInChildren(Collider).forEach(c => c.destroy());
        }
    }

    /**
     * shoot an arrow
     * @param from position to shoot from
     * @param vec direction to shoot (not normalized)
     */
    private async shoot(from: Vector3, vec: Vector3) {
        if (!this.arrowPrefab) return;
        
        this._lastShotTimestamp = this.context.time.time;

        const pos = from.clone();
        const lookGoal = pos.clone().add(vec);
        const force = Math.pow(vec.length() + .5, 2);
        const dir = vec.clone().normalize();

        const instance = await this.arrowPrefab.instantiate({ parent: this.context.scene });

        if (!instance) {
            console.error("Failed to instantiate arrow prefab, please check that objects are assigned correctly.");
            return;
        }

        instance.worldPosition = pos;
        instance.lookAt(lookGoal);
        instance.visible = true;

        const rb = instance.getComponent(Rigidbody)!;
        if (rb) {
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

    private getScreenDragPoint(pointerId: number, target: Vector3): Vector3 {
        const rc = this.context.input.getPointerPositionRC(pointerId)!;
        this._screenDragRaycaster.setFromCamera(rc, this.context.mainCamera);
        const ray = this._screenDragRaycaster.ray;
        this._screenDragRayLine.set(ray.origin, ray.direction.multiplyScalar(100000));
        if (!this._screenDragPlane.intersectLine(this._screenDragRayLine, target))
            target.set(0,0,0);

        if (debug) Gizmos.DrawWireSphere(target, 0.01, 0xff0000, 1);

        return target;
    }

    onBeforeRender(): void {
        if (!this.animationComponent || !this.bowObject) return;

        // animation driving setup
        if (!this._mixer) {
            this._mixer = new AnimationMixer(this.bowObject);
            const anim = this.animationComponent.animations.at(0);
            if (anim)
                this._animation = this._mixer.clipAction(anim);
        }

        const animGoalSmoothing = 0.1;
        let animTimeGoal = 0;
    
        const from = getTempVector();
        const to = getTempVector();
        const bowUp = getTempVector(this.bowObject.worldUp);

        // VR Logic
        if (this._hasControllers) {
            if (!this._isAiming) {
                animTimeGoal = 0;
                this._lastShotTimestamp = this.context.time.time; // hide the arrow
            }
            else if (this.context.xr && this.context.xr.controllers.length > 1 && this._bowController !== undefined && this._stringController !== undefined) {
                const holdingString = this.context.xr.controllers[this._stringController];
                const holdingBow = this.context.xr.controllers[this._bowController];
    
                // sanity check: do we have valid controllers?
                if (!holdingString || !holdingBow) return;

                from.copy(holdingString.gripWorldPosition);
                to.copy(holdingBow.gripWorldPosition);
            }
        }
        // Non-VR Logic
        else {

            if (this._stringPointerId !== undefined) {
                to.copy(this._aimingPointerStartPos);
                from.copy(this.getScreenDragPoint(this._stringPointerId, getTempVector()));
            }
        }

        if (this._isAiming && (from.dot(from) > 0 && to.dot(to) > 0)) {
            let dist = from.distanceTo(to);
            let animation01 = Mathf.clamp01((dist - this.drawMinPhysicalDistance) / this.drawMaxPhysicalDistance);
            animTimeGoal = animation01;
            
            if (dist > 0.025) {
                this._tempLookMatrix.lookAt(from, to, bowUp);
                this._tempLookRot.setFromRotationMatrix(this._tempLookMatrix);
                this.bowObject.worldQuaternion = this._tempLookRot;
            }
        }
        
        // apply draw curve
        if (this.drawProgression)
            animTimeGoal = this.drawProgression.evaluate(animTimeGoal);
        
        if (!this._isAiming && !this._hasControllers)
            animTimeGoal = 0.25;

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

        if (this._drawingArrow) {
            const fadeDuration = 0.3; // time to scale a new arrow in when the last was
            let t = (this.context.time.time - this._lastShotTimestamp) / fadeDuration;
            t = this.easeInOutSine(Mathf.clamp01(t));
            this._drawingArrow.worldScale = getTempVector(1, 1, 1).multiplyScalar(t);
        }
    }

    // Cubic Bezier easing function
    private easeInOutSine(t: number): number {
        return Mathf.clamp01(-0.5 * (Math.cos(Math.PI * t) - 1));
    }
}