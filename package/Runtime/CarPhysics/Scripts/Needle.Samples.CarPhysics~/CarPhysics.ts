import { DynamicRayCastVehicleController, World, Quaternion, Vector, RigidBody as RapierRigidbody } from "@dimforge/rapier3d-compat";

import { Behaviour, Gizmos, Mathf, Rigidbody, delayForFrames, getParam, getTempVector, serializable, ParticleSystem, ParticleSystemBaseBehaviour, QParticle, QTrailParticle, getTempQuaternion, getWorldDirection, setWorldPosition, FrameEvent, WaitForFrames } from "@needle-tools/engine";

import { Vector3, Vector2, Object3D } from "three";

const debugCarPhysics = getParam("debugcarphysics");
const debugWheel = getParam("debugwheel");

export enum CarAxle { front, rear }
export enum CarDrive { front, rear, all }

function rapierVectorToThreeVector(v: Vector | null): Vector3 | undefined { 
    if (v == null) {
        return undefined;
    }
    return getTempVector(v.x, v.y, v.z);
}

export class CarWheel extends Behaviour {
    @serializable(Object3D)
    wheelModel?: Object3D

    @serializable()
    axle: CarAxle = CarAxle.front;

    @serializable()
    radius: number = 1;

    // ---  Suspension --- 
    @serializable()
    suspensionCompression: number = 0.82;
    @serializable()
    suspensionRelax: number = 0.88;
    @serializable()
    suspensionRestLength: number = 0.2;
    @serializable()
    suspensionStiff: number = 5.8;
    @serializable()
    maxSuspensionForce: number = 6000;
    @serializable()
    suspensionTravel: number = 5;

    // --- Friction ---
    @serializable()
    sideFrictionStiffness: number = 0.5;

    @serializable(Vector2)
    frictionSlip: Vector2 = new Vector2(2, 10.5);

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
    private wheelIndex: number = -1;
    initialize(car: CarPhysics, vehicle: DynamicRayCastVehicleController, i: number) {
        this.car = car;
        this.vehicle = vehicle;
        this.wheelIndex = i;

        const target = (this.wheelModel ?? this.gameObject);
        this.wheelModelUp = target.up;
        this.wheelModelRight = getWorldDirection(target).cross(target.up).clone();
        this.wheelModelRight.applyQuaternion(car.gameObject.worldQuaternion);

        const wPos = this.worldPosition;
        const rPos = this.car.gameObject.worldToLocal(wPos);
        
        const suspensionDirection = getTempVector(0,-1,0);
        const axleDirection = getTempVector(-1, 0, 0);

        this.vehicle.addWheel(rPos, suspensionDirection, axleDirection, this.suspensionRestLength, this.radius);

        this.vehicle.setWheelSuspensionCompression(i, this.suspensionCompression);
        this.vehicle.setWheelSuspensionRelaxation(i, this.suspensionRelax);
        this.vehicle.setWheelSuspensionStiffness(i, this.suspensionStiff);
        this.vehicle.setWheelMaxSuspensionForce(i, this.maxSuspensionForce);
        this.vehicle.setWheelMaxSuspensionTravel(i, this.suspensionTravel);

        this.vehicle.setWheelSideFrictionStiffness(i, this.sideFrictionStiffness);
        this.vehicle.setWheelFrictionSlip(i, this.frictionSlip.y);

        if(this.skidParticle) {
            this.skidParticleBehaviour = new SkidTrailBehaviour();
            this.skidParticle.addBehaviour(this.skidParticleBehaviour);
        }

        this.wheelModelOffset = new Vector3(0,0,0).copy(target.getWorldPosition(getTempVector()).sub(this.worldPosition));
        this.wheelModelOffset.y = 0; // will be set by suspension
    }
    
    updateVisuals() {
        const target = this.wheelModel ?? this.gameObject;

        // rotation
        const wheelRotX = this.vehicle.wheelRotation(this.wheelIndex)!;
        const wheelRotY = this.vehicle.wheelSteering(this.wheelIndex)!;

        const yRot = getTempQuaternion().setFromAxisAngle(this.wheelModelUp, wheelRotY);
        const xRot = getTempQuaternion().setFromAxisAngle(this.wheelModelRight, wheelRotX);

        const rot = yRot.multiply(xRot);

        target.quaternion.copy(rot);
        
        // position
        const contact = rapierVectorToThreeVector(this.vehicle.wheelContactPoint(this.wheelIndex) as Vector);
        const isInContact = this.vehicle.wheelIsInContact(this.wheelIndex);
        const wheelPosition = getTempVector();
        if (contact) {
            wheelPosition.copy(this.car.gameObject.worldUp).multiplyScalar(this.radius).add(contact);
            /* wheelPosition.add(this.wheelModelOffset); */
            setWorldPosition(target, wheelPosition);
        }

        // skid
        const sideAmount = Math.abs(this.vehicle.wheelSideImpulse(this.wheelIndex) ?? 0);
        const breakAmount = Math.abs(this.vehicle.wheelBrake(this.wheelIndex) ?? 0);
        const isSkidding = sideAmount > this.skidVisualSideThreshold || breakAmount > this.skidVisualBreakThreshold;
        const showSkid = isInContact && contact != undefined && isSkidding;
        
        if (this.skidParticle) {
            const wPos = getTempVector(contact);
            wPos.y += this.skidParticle.main.startSize.constant / 4; // offset the effect
            this.skidParticle.worldPosition = wPos;
        }

        if (this.skidParticleBehaviour) {
            this.skidParticleBehaviour.isSkidding = showSkid;
        }

        if (debugWheel) {
            const suspensionRest = getTempVector(0, -1, 0).multiplyScalar(this.suspensionRestLength).add(this.worldPosition); 

            // draw wheel
            Gizmos.DrawCircle(wheelPosition, this.right, this.radius, 0x000ff, 0, false);
            Gizmos.DrawLine(getTempVector(wheelPosition).add(this.forward.multiplyScalar(-this.radius)), getTempVector(wheelPosition).add(this.forward.multiplyScalar(this.radius)), 0x0000ff, 0, false);
            //Gizmos.DrawLine(getTempVector(wheelPosition).add(this.up.multiplyScalar(-0.02)), getTempVector(wheelPosition).add(this.up.multiplyScalar(0.02)), 0x0000ff, 0, false);

            // draw susnpension line
            Gizmos.DrawLine(getTempVector(suspensionRest).add(this.forward.multiplyScalar(-0.1)), getTempVector(suspensionRest).add(this.forward.multiplyScalar(0.1)), 0xff0000, 0, false);
            Gizmos.DrawLine(getTempVector(suspensionRest).add(this.up.multiplyScalar(this.suspensionTravel)), getTempVector(suspensionRest).add(this.up.multiplyScalar(-this.suspensionTravel)), 0xebd834, 0, false);
        }
    }

    applyPhysics(acceleration: number, breaking: number, steeringRad: number) {
        const isOnDrivingAxel = (this.car.carDrive == CarDrive.front && this.axle == CarAxle.front) ||
                                (this.car.carDrive == CarDrive.rear && this.axle == CarAxle.rear) ||
                                this.car.carDrive == CarDrive.all;

        if (!isOnDrivingAxel)
            acceleration = 0;

        // Note: dot is not linear
        const velocity = this.car.velocity;
        let gripAmount = velocity.dot(this.car.gameObject.getWorldDirection(getTempVector()));
        gripAmount = Mathf.clamp(gripAmount, 0, 1);

        if (velocity.length() < 1) {
            gripAmount = 1;
        }

        // accel & break
        this.vehicle.setWheelEngineForce(this.wheelIndex, acceleration);
        this.vehicle.setWheelBrake(this.wheelIndex, breaking);

        // steer
        if (this.axle == CarAxle.front) {
            this.vehicle.setWheelSteering(this.wheelIndex, -steeringRad); // inverted X
        }

        // slip
        this.vehicle.setWheelFrictionSlip(this.wheelIndex, Mathf.lerp(this.frictionSlip.x, this.frictionSlip.y, gripAmount));
    }
}

// @nonSerializable
export class SkidTrailBehaviour extends ParticleSystemBaseBehaviour {
    isSkidding: boolean = false;

    update(particle: QParticle, _delta: number): void {
        const trail = particle as QTrailParticle;
        if(this.system.trails?.enabled && trail) {
            // the most new particle wouldn't get affected
            if (!this.isSkidding) {
                particle.color.setW(0);
            }

            let tail = trail.previous?.tail;
            while(tail && tail.hasPrev()) {
                const myTail = tail as any;
                myTail.data ??= {};

                if (myTail.data["isSkidding"] === undefined) {
                    myTail.data["isSkidding"] = this.isSkidding;
                }

                if(myTail.data["isSkidding"] === false) {
                    tail.data.color?.setW(0);
                }
                tail = tail.prev;
            }
        }
    }
}

export class CarPhysics extends Behaviour {
    @serializable(CarWheel)
    wheels: CarWheel[] = [];

    // @tooltip The maximum steering angle in degrees
    @serializable()
    maxSteer: number = 35;

    @serializable()
    steerSmoothingFactor: number = 3;

    @serializable()
    accelerationForce: number = 75;
    
    @serializable()
    breakForce: number = 1;

    @serializable()
    topSpeed: number = 20;

    @serializable()
    carDrive: CarDrive = CarDrive.all;

    private vehicle!: DynamicRayCastVehicleController;
    private rigidbody!: Rigidbody;
    private rapierRigidbody!: RapierRigidbody;

    private currSteerSmooth: number = 0;
    private currSteer: number = 0;
    private currAcc: number = 0;

    private posOnStart!: Vector3;
    private rotOnStart!: Quaternion;

    // @nonSerialized
    get velocity() { return this.rigidbody.getVelocity(); }    

    awake(): void {
        if (!this.rigidbody) {
            this.rigidbody = this.gameObject.addComponent(Rigidbody);
            this.rigidbody.autoMass = false;
            this.rigidbody.mass = 250;
        }
    }

    private _physicsRoutine?: Generator;
    onEnable(): void {
        this.onDisable();
        this._physicsRoutine = this.startCoroutine(this.physicsLoop(), FrameEvent.PostPhysicsStep);
    }
    onDisable(): void {
        if (this._physicsRoutine) {
            this.stopCoroutine(this._physicsRoutine);
        }
    }

    async start() {
        // save start orientation
        this.posOnStart = this.gameObject.position.clone();
        this.rotOnStart = this.gameObject.quaternion.clone();

        // get or create needle rigidbody
        this.rigidbody = this.gameObject.getComponent(Rigidbody)!;

        // await rigidbody creation
        await delayForFrames(2);        

        // get underlying rapier rigidbody
        this.rapierRigidbody = this.context.physics.engine?.getBody(this.rigidbody);
        const world = this.context.physics.engine?.world as World;

        if (!world) throw new Error("Physics engine (Rapier) not found");
        if (!this.rapierRigidbody) throw new Error("Rapier Rigidbody not found");        

        // create vehicle physics
        this.vehicle = world.createVehicleController(this.rapierRigidbody);

        this.vehicle.indexUpAxis = 1;
        this.vehicle.setIndexForwardAxis = 2;

        // initialize wheels
        if (this.wheels.length == 0) {
            this.wheels.push(...this.gameObject.getComponentsInChildren(CarWheel).filter(x => x.gameObject.visible));
        }

        if (debugCarPhysics) {
            console.log(`wheels: (${this.wheels.length})`, this.wheels);
        }

        this.wheels.forEach((wheel, i) => { 
            wheel.initialize(this, this.vehicle, i);
        });
    }

    steerInput(steerAmount: number) {
        this.currSteer = Mathf.clamp(this.currSteer + steerAmount, -1, 1);
    }

    accelerationInput(accelAmount: number) {
        this.currAcc = Mathf.clamp(this.currAcc + accelAmount, -1, 1);
    }

    onBeforeRender() {
        if (!this.vehicle) return;

        this.desktopInput();

        // steering smoothing
        this.currSteerSmooth = Mathf.lerp(this.currSteerSmooth, this.currSteer, this.steerSmoothingFactor * this.context.time.deltaTime);

        this.applyPhysics();

        // update visuals
        this.updateWheelVisual();

        if (debugCarPhysics) {
            const pos = getTempVector(this.worldPosition).add(getTempVector(0, 1.5, 0));
            const text = `vel: ${this.rigidbody.getVelocity().length().toFixed(2)}`;
            Gizmos.DrawLabel(pos, text, 0.1, 0, 0xffffff, 0x000000);
            this.wheels.forEach(x => Gizmos.DrawLine(this.worldPosition, x.worldPosition, 0x0000ff, 0, false));
        }
    }

    *physicsLoop() {
        while(true) {
            if (this.vehicle) {
                if (this.context.input.isKeyDown("r")) {
                    this.reset();
                }

                this.resetWhenRolledOver();

                const dt = this.context.time.deltaTime;
                this.rigidbody.wakeUp(); 
                this.vehicle.updateVehicle(dt);
            }

            yield WaitForFrames(1);
        }
    }

    // reset input
    earlyUpdate(): void {
        this.currSteer = 0;
        this.currAcc = 0;
    }

    private desktopInput() {
        let steer = 0;
        if (this.context.input.isKeyPressed("a")) {
            steer -= 1;
        }
        else if (this.context.input.isKeyPressed("d")) {
            steer += 1;
        }

        let accel = 0;
        if (this.context.input.isKeyPressed("s")) {
            accel -= 1;
        }
        if (this.context.input.isKeyPressed("w")) {
            accel += 1;
        }
        this.steerInput(steer);
        this.accelerationInput(accel);
    }

    reset() {
        this.teleportVehicle(this.posOnStart, this.rotOnStart);
    }

    // @nonSerialized
    teleportVehicle(worldPosition: Vector3 | undefined, worldRotation: Quaternion | undefined, resetVelocities: boolean = true) {
        if (!this.rapierRigidbody) return;

        if (worldPosition) {
            this.rapierRigidbody.setTranslation(worldPosition, true);
        }

        if (worldRotation) {
            this.rapierRigidbody.setRotation(worldRotation, true);
        }

        if (resetVelocities) {
            this.rapierRigidbody.resetForces(true);
            this.rapierRigidbody.resetTorques(true);
        }
    }

    private applyPhysics() {
        let breakForce = 0;
        let accelForce = 0;

        const velDir = this.rigidbody.getVelocity();
        const vel = velDir.length();
        const reachedTopSpeed = vel > this.topSpeed;

        // breaking
        const isBreaking = this.currAcc < 0 && vel > 0.1 && velDir.dot(this.gameObject.worldForward) > 0;
        if (isBreaking) {
            breakForce = this.breakForce;
        }

        // acceleration
        const isAccelerating = this.currAcc != 0 && !isBreaking && !reachedTopSpeed;
        if(isAccelerating)
            accelForce = this.accelerationForce * this.currAcc;

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

    private rolledOverDuration: number = 0;
    private resetWhenRolledOver() {
        const isRolledOver = this.gameObject.worldUp.dot(getTempVector(0, 1, 0)) < 0.65;
        const isSlow = this.rigidbody.getVelocity().length() < 0.1;
        if (isRolledOver && isSlow) {
            this.rolledOverDuration += this.context.time.deltaTime;
        }
        else {
            this.rolledOverDuration = 0;
        }

        if (this.rolledOverDuration > 1) {
            this.rescueVehicle();
        }
    }
    
    // TODO: add raycast to determine normal of the surface the car is resetting to
    private async rescueVehicle() {
        const pos = this.worldPosition;
        pos.y += 1;

        const fwd = this.forward;
        fwd.y = 0;
        fwd.normalize();

        const rot = getTempQuaternion().setFromUnitVectors(getTempVector(0,0,-1), fwd);

        this.teleportVehicle(pos, rot);
    }
}