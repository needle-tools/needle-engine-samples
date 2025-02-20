import { DynamicRayCastVehicleController, World, Quaternion, Vector, RigidBody as RapierRigidbody } from "@dimforge/rapier3d-compat";

import { Behaviour, Gizmos, Mathf, Rigidbody, getParam, getTempVector, serializable, ParticleSystem, ParticleSystemBaseBehaviour, QParticle, QTrailParticle, getTempQuaternion, getWorldDirection, setWorldPosition, FrameEvent, delayForFrames, Collider, getBoundingBox, BoxCollider } from "@needle-tools/engine";

import { Vector3, Vector2, Object3D } from "three";

const debugCarPhysics = getParam("debugcarphysics");
const debugWheel = getParam("debugwheel");

export enum CarDrive {
    all = 0,
    rear = 1,
    front = 2,
}
export enum CarAxle {
    front = 1,
    rear = 2
}


export class CarWheel extends Behaviour {

    /** The wheel index in the car */
    get index() { return this._wheelIndex; }

    @serializable(Object3D)
    wheelModel?: Object3D

    @serializable()
    axle: CarAxle = CarAxle.front;

    @serializable()
    radius: number = .25;

    // ---  Suspension --- 
    @serializable()
    suspensionCompression: number = 0.5;
    @serializable()
    suspensionRelax: number = 2.5;
    @serializable()
    suspensionRestLength: number = 0.25;
    @serializable()
    suspensionStiff: number = 45;
    @serializable()
    maxSuspensionForce: number = 6000;
    @serializable()
    suspensionTravel: number = .1;

    // --- Friction ---
    @serializable()
    sideFrictionStiffness: number = 0.5;

    @serializable(Vector2)
    frictionSlip: Vector2 = new Vector2(2, 50);

    // --- Visuals ---
    @serializable(ParticleSystem)
    skidParticle?: ParticleSystem;

    @serializable()
    skidVisualSideThreshold: number = 5;

    @serializable()
    skidVisualBreakThreshold: number = 0.1;

    private skidParticleBehaviour?: SkidTrailBehaviour;

    private wheelModelRight!: Vector3;
    private wheelModelUp!: Vector3;

    private wheelModelOffset!: Vector3;

    private car!: CarPhysics;
    private vehicle!: DynamicRayCastVehicleController;
    private _wheelIndex: number = -1;

    initialize(car: CarPhysics, vehicle: DynamicRayCastVehicleController, i: number) {
        this.car = car;
        this.vehicle = vehicle;
        this._wheelIndex = i;

        const target = this.wheelModel ?? this.gameObject;
        this.wheelModelUp = target.up;
        this.wheelModelRight = target.worldForward.clone();
        this.wheelModelRight.applyQuaternion(car.gameObject.worldQuaternion);

        const wPos = this.worldPosition;
        const lPos = this.car.gameObject.worldToLocal(wPos);
        // Move the wheel up by half radius (assuming our component is centered to the wheel model)
        lPos.y += this.radius * .5;

        const suspensionDirection = getTempVector(0, -1, 0);
        const axleDirection = getTempVector(0, 0, -1);

        this.vehicle.addWheel(lPos, suspensionDirection, axleDirection, this.suspensionRestLength, this.radius);

        this.vehicle.setWheelSuspensionCompression(i, this.suspensionCompression);
        this.vehicle.setWheelSuspensionRelaxation(i, this.suspensionRelax);
        this.vehicle.setWheelSuspensionStiffness(i, this.suspensionStiff);
        this.vehicle.setWheelMaxSuspensionForce(i, this.maxSuspensionForce);
        this.vehicle.setWheelMaxSuspensionTravel(i, this.suspensionTravel);

        this.vehicle.setWheelSideFrictionStiffness(i, this.sideFrictionStiffness);
        this.vehicle.setWheelFrictionSlip(i, this.frictionSlip.y);

        if (this.skidParticle) {
            this.skidParticleBehaviour = new SkidTrailBehaviour();
            this.skidParticle.addBehaviour(this.skidParticleBehaviour);
        }

        this.wheelModelOffset = new Vector3(0, 0, 0).copy(target.worldPosition.sub(this.worldPosition));
        this.wheelModelOffset.y = 0; // will be set by suspension
    }

    updateVisuals() {
        const target = this.wheelModel ?? this.gameObject;

        // rotation
        const wheelRot = this.vehicle.wheelRotation(this._wheelIndex)!;
        const wheelTurn = this.vehicle.wheelSteering(this._wheelIndex)!;

        const yRot = getTempQuaternion().setFromAxisAngle(this.wheelModelUp, wheelTurn);
        const xRot = getTempQuaternion().setFromAxisAngle(this.wheelModelRight, wheelRot);
        const rot = yRot.multiply(xRot);

        target.quaternion.copy(rot);

        // position
        const contact = this.vehicle.wheelContactPoint(this._wheelIndex);
        const isInContact = this.vehicle.wheelIsInContact(this._wheelIndex);
        const wheelPosition = getTempVector();
        if (contact) {        
            wheelPosition.copy(this.car.gameObject.worldUp).multiplyScalar(this.radius).add(contact);
            /* wheelPosition.add(this.wheelModelOffset); */
            setWorldPosition(target, wheelPosition);
        }

        // skid
        const sideAmount = Math.abs(this.vehicle.wheelSideImpulse(this._wheelIndex) ?? 0);
        const breakAmount = Math.abs(this.vehicle.wheelBrake(this._wheelIndex) ?? 0);
        const isSkidding = sideAmount > this.skidVisualSideThreshold || breakAmount > this.skidVisualBreakThreshold;
        const showSkid = isInContact && contact != undefined && isSkidding;

        if (this.skidParticle && contact) {
            const wPos = getTempVector(contact);
            wPos.y += this.skidParticle.main.startSize.constant / 4; // offset the effect
            this.skidParticle.worldPosition = wPos;
        }

        if (this.skidParticleBehaviour) {
            this.skidParticleBehaviour.isSkidding = showSkid;
        }

        // debug
        if (debugWheel) {
            const suspensionRest = getTempVector(0, -1, 0).multiplyScalar(this.suspensionRestLength).add(this.worldPosition);

            // draw wheel
            Gizmos.DrawCircle(wheelPosition, this.forward, this.radius, 0x000ff, 0, false);
            Gizmos.DrawLine(getTempVector(wheelPosition).add(this.forward.multiplyScalar(-this.radius)), getTempVector(wheelPosition).add(this.forward.multiplyScalar(this.radius)), 0x0000ff, 0, false);

            // draw susnpension line
            Gizmos.DrawLine(getTempVector(suspensionRest).add(this.forward.multiplyScalar(-0.1)), getTempVector(suspensionRest).add(this.forward.multiplyScalar(0.1)), 0xff0000, 0, false);
            Gizmos.DrawLine(getTempVector(suspensionRest).add(this.up.multiplyScalar(this.suspensionTravel)), getTempVector(suspensionRest).add(this.up.multiplyScalar(-this.suspensionTravel)), 0xebd834, 0, false);
        }
    }

    applyPhysics(acceleration: number, breaking: number, steeringRad: number) {
        const isOnDrivingAxle = 
               (this.car.carDrive == CarDrive.front && this.axle == CarAxle.front)
            || (this.car.carDrive == CarDrive.rear && this.axle == CarAxle.rear)
            || (this.car.carDrive == CarDrive.all);

        if (!isOnDrivingAxle)
            acceleration = 0;

        const velocity = this.car.velocity;
        let gripAmount = velocity.dot(this.car.gameObject.worldForward);
        gripAmount = Mathf.clamp(gripAmount, 0, 1);

        if (velocity.length() < 1) {
            gripAmount = 1;
        }

        // accel & break
        this.vehicle.setWheelEngineForce(this._wheelIndex, acceleration);
        this.vehicle.setWheelBrake(this._wheelIndex, breaking);

        // steer
        if (this.axle == CarAxle.front) {
            this.vehicle.setWheelSteering(this._wheelIndex, -steeringRad); // inverted X
        }

        // slip
        this.vehicle.setWheelFrictionSlip(this._wheelIndex, Mathf.lerp(this.frictionSlip.x, this.frictionSlip.y, gripAmount));
    }
}

// @nonSerializable
export class SkidTrailBehaviour extends ParticleSystemBaseBehaviour {
    isSkidding: boolean = false;

    update(particle: QParticle, _delta: number): void {
        const trail = particle as QTrailParticle;
        if (this.system.trails?.enabled && trail) {
            // the most new particle wouldn't get affected
            if (!this.isSkidding) {
                particle.color.setW(0);
            }

            let tail = trail.previous?.tail;
            while (tail && tail.hasPrev()) {
                const myTail = tail as any;
                myTail.data ??= {};

                if (myTail.data["isSkidding"] === undefined) {
                    myTail.data["isSkidding"] = this.isSkidding;
                }

                if (myTail.data["isSkidding"] === false) {
                    tail.data.color?.setW(0);
                }
                tail = tail.prev;
            }
        }
    }
}

export class CarPhysics extends Behaviour {

    @serializable()
    carDrive: CarDrive = CarDrive.all;

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
            this._rigidbody.autoMass = false;
            this._rigidbody.mass = 250;
        }
        // Ensure we have a collider
        if (!this.gameObject.getComponentInChildren(Collider)) {
            BoxCollider.add(this.gameObject);
        }
    }

    private _physicsRoutine?: Generator;
    /** @internal */
    async onEnable() {
        // get or create needle rigidbody
        this._rigidbody = this.gameObject.getOrAddComponent(Rigidbody)!;

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
            this._vehicle.setIndexForwardAxis = 0;
        }

        // initialize wheels
        if (this.wheels.length === 0) {
            this.wheels.push(...this.gameObject.getComponentsInChildren(CarWheel).filter(x => x.activeAndEnabled));
        }
        if(this.wheels.length <= 0){
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
            const pos = getTempVector(this.worldPosition).add(getTempVector(0, 1.5, 0));
            const text = `vel: ${this._rigidbody.getVelocity().length().toFixed(2)}`;
            Gizmos.DrawLabel(pos, text, 0.1, 0, 0xffffff, 0x000000);
            this.wheels.forEach(x => Gizmos.DrawLine(this.worldPosition, x.worldPosition, 0x0000ff, 0, false));
        }

    }

    // @nonSerialized
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