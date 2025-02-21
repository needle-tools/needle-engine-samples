import { DynamicRayCastVehicleController, World, RigidBody as RapierRigidbody } from "@dimforge/rapier3d-compat";

import { Behaviour, Gizmos, Mathf, Rigidbody, getParam, getTempVector, serializable, ParticleSystem, ParticleSystemBaseBehaviour, QParticle, QTrailParticle, getTempQuaternion, getWorldDirection, setWorldPosition, FrameEvent, delayForFrames, Collider, getBoundingBox, BoxCollider, euler } from "@needle-tools/engine";

import { Vector3, Vector2, Object3D, Quaternion, Euler } from "three";
import { CarAxle, CarDrive } from "./constants.js";
import { CarWheel } from "./CarWheel.js";

const debugCarPhysics = getParam("debugcarphysics");

export class CarPhysics extends Behaviour {

    @serializable()
    carDrive: CarDrive = CarDrive.all;

    @serializable()
    mass: number = 150;

    // @tooltip The maximum steering angle in degrees
    @serializable()
    maxSteer: number = 45;

    @serializable()
    steerSmoothingFactor: number = .5;

    @serializable()
    accelerationForce: number = 3;

    @serializable()
    breakForce: number = 1;

    @serializable()
    topSpeed: number = 15;

    @serializable(CarWheel)
    wheels: CarWheel[] = [];

    /**
     * Steer the car. -1 is full left, 1 is full right
     * @param steerAmount -1 to 1
     */
    steerInput(steerAmount: number) {
        this.currSteer = Mathf.clamp(this.currSteer + steerAmount, -1, 1);
    }

    /**
     * Increase or decrease acceleration
     * @param accelAmount -1 to 1
     */
    accelerationInput(accelAmount: number) {
        this.currAcc = Mathf.clamp(this.currAcc + accelAmount, -1, 1);
    }


    /** Rapier Physics Rigidbody */
    get rigidbody() { return this._rigidbody; }
    get vehicle() { return this._vehicle; }
    // @nonSerialized
    get velocity() { return this._rigidbody?.getVelocity(); }

    private _vehicle!: DynamicRayCastVehicleController;
    private _rigidbody!: Rigidbody;
    private rapierRigidbody!: RapierRigidbody;

    private currSteerSmooth: number = 0;
    private currSteer: number = 0;
    private currAcc: number = 0;



    /** @internal */
    awake(): void {
        if (!this._rigidbody) {
            this._rigidbody = this.gameObject.addComponent(Rigidbody);
        }
        // Ensure we have a collider
        if (!this.gameObject.getComponentInChildren(Collider)) {
            const collider = BoxCollider.add(this.gameObject);
            collider.center.y += collider.size.y * .1;
            collider.size.y *= .9;
            collider.size.multiplyScalar(.9);
            collider.updateProperties();
        }
    }

    private _physicsRoutine?: Generator;
    /** @internal */
    async onEnable() {
        // get or create needle rigidbody
        this._rigidbody = this.gameObject.getOrAddComponent(Rigidbody)!;
        this._rigidbody.autoMass = false;
        this._rigidbody.mass = this.mass;

        // get underlying rapier rigidbody
        await this.context.physics.engine?.initialize().then(() => delayForFrames(1));
        if (!this.enabled) return;

        this.rapierRigidbody = this.context.physics.engine?.getBody(this._rigidbody);
        const world = this.context.physics.engine?.world as World;

        if (!world) {
            console.error("[CarPhysics] Physics world not found");
            return;
        }
        if (!this.rapierRigidbody) {
            console.error("[CarPhysics] Rigidbody not found");
            return;
        }

        // create vehicle physics
        if (!this._vehicle) {
            this._vehicle = world.createVehicleController(this.rapierRigidbody);
            this._vehicle.indexUpAxis = 1;
            this._vehicle.setIndexForwardAxis = 2;
        }

        // initialize wheels
        if (this.wheels.length === 0) {
            this.wheels.push(...this.gameObject.getComponentsInChildren(CarWheel).filter(x => x.activeAndEnabled));
        }
        if (this.wheels.length <= 0) {
            console.warn(`[CarPhysics] No wheels found on ${this.gameObject.name}`);
        }

        if (debugCarPhysics) {
            console.log(`[CarPhysics] Wheels: (${this.wheels.length})`, this.wheels);
        }

        this.wheels.forEach((wheel, i) => {
            wheel.initialize(this, this._vehicle, i);
        });

        this._physicsRoutine = this.startCoroutine(this.physicsLoop(), FrameEvent.PostPhysicsStep);
    }
    /** @internal */
    onDisable(): void {
        if (this._physicsRoutine) {
            this.stopCoroutine(this._physicsRoutine);
        }
    }
    /** @internal */
    onBeforeRender() {
        if (!this._vehicle) return;

        // steering smoothing
        this.currSteerSmooth = Mathf.lerp(this.currSteerSmooth, this.currSteer, Mathf.clamp01(this.context.time.deltaTime / Math.max(.0001, this.steerSmoothingFactor)));

        this.applyPhysics();

        this.currSteer = 0;
        this.currAcc = 0;

        // update visuals
        this.updateWheelVisual();

        if (debugCarPhysics) {
            const pos = getTempVector(this.worldPosition).add(getTempVector(0, 2, 0));
            const text = `vel: ${this._rigidbody.getVelocity().length().toFixed(2)}`;
            Gizmos.DrawLabel(pos, text, 0.1, 0, 0xffffff, 0x000000);
            this.wheels.forEach(x => Gizmos.DrawLine(this.worldPosition, x.worldPosition, 0x0000ff, 0, false));
        }

    }

    teleport(worldPosition: Vector3 | undefined, worldRotation: Quaternion | undefined, resetVelocities: boolean = true) {
        if (!this.rapierRigidbody || !this._vehicle) return;

        if (worldPosition) {
            this.rapierRigidbody.setTranslation(worldPosition, true);
        }

        if (worldRotation) {
            this.rapierRigidbody.setRotation(worldRotation, true);
        }

        if (resetVelocities) {
            this._rigidbody.setVelocity(0, 0, 0);
        }
    }

    private *physicsLoop() {
        while (true) {
            if (this._vehicle) {
                const dt = this.context.time.deltaTime;
                this._rigidbody.wakeUp();
                this._vehicle?.updateVehicle(dt);
            }
            yield null;
        }
    }

    private applyPhysics() {
        let breakForce = 0;
        let accelForce = 0;

        const velDir = this._rigidbody.getVelocity();
        const vel = velDir.length();
        const reachedTopSpeed = vel > this.topSpeed;

        // breaking
        const isBreaking = this.currAcc < 0 && vel > 0.1 && velDir.dot(this.gameObject.worldForward) > 0;
        if (isBreaking) {
            breakForce = this.breakForce;
        }

        // acceleration
        const isAccelerating = this.currAcc != 0 && !isBreaking && !reachedTopSpeed;
        if (isAccelerating)
            accelForce = (this.accelerationForce / this.context.time.deltaTime) * this.currAcc;

        // steer
        const steer = this.currSteerSmooth * this.maxSteer * Mathf.Deg2Rad;

        // updateWheels
        this.wheels.forEach((wheel) => {
            wheel.applyPhysics(accelForce, breakForce, steer);
        });
    }

    private updateWheelVisual() {
        this.wheels.forEach((wheel) => {
            wheel.updateVisuals();
        });
    }
}