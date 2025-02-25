import { DynamicRayCastVehicleController } from "@dimforge/rapier3d-compat";
import { Behaviour, delayForFrames, getBoundingBox, getParam, getTempQuaternion, getTempVector, Gizmos, Mathf, ObjectUtils, ParticleSystem, ParticleSystemBaseBehaviour, QParticle, QTrailParticle, serializable } from "@needle-tools/engine";
import { Object3D, Vector2, Vector3, Quaternion, Euler, Matrix4 } from "three";
import type { CarPhysics } from "./CarPhysics.js";
import { CarAxle, CarDrive } from "./constants.js";

const debugWheel = getParam("debugwheels");


export class CarWheel extends Behaviour {

    /** The wheel index in the car */
    get index() { return this._wheelIndex; }

    @serializable(Object3D)
    wheelModel?: Object3D

    @serializable()
    axle: CarAxle = CarAxle.front;

    /**
     * The radius of the wheel.
     * @default -1 = will be calculated based on the model
     */
    @serializable()
    radius: number = -1;
    /**
     * The rest length of the suspension.
     * @default -1 = will be calculated based on the radius
     */
    @serializable()
    suspensionRestLength: number = -1;
    /**
     * The maximum travel distance of the suspension.
     * @default -1 = will be calculated based on the radius
     */
    @serializable()
    maxSuspensionTravel: number = -1;
    /**
     * The compression of the suspension.
     * @default 2
     */
    @serializable()
    suspensionCompression: number = 2;
    /**
     * The relaxation of the suspension.
     * @default 3
     */
    @serializable()
    suspensionRelax: number = 3;
    /** 
     * The stiffness of the suspension.
     * @default 50
     */
    @serializable()
    suspensionStiff: number = 50;
    @serializable()
    maxSuspensionForce: number = 1000;

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


    private car!: CarPhysics;
    private vehicle!: DynamicRayCastVehicleController;
    private _wheelIndex: number = -1;
    private _activeRadius : number = -1;

    async initialize(car: CarPhysics, vehicle: DynamicRayCastVehicleController, i: number) {
        this.car = car;
        this.vehicle = vehicle;
        this._wheelIndex = i;

        const target = this.wheelModel || this.gameObject;

        // Assuming that all car wheels have the same car-relative axis. 
        // Meaning car-relative X is to the side of the car and Z is forward
        // If we don't reset the rotations here the wheel may be rotated in a weird way
        // This should normally only an issue for vehicles with non-standard wheel orientations
        this.wheelModel?.quaternion.identity();
        this.gameObject?.quaternion.identity();

        

        // Automatically calculate the radius if it's not set
        let radius = this.radius;
        if (radius <= 0) {
            const bounds = getBoundingBox(target);
            radius = bounds.getSize(getTempVector()).y * .5;
        }
        if (radius < 0) {
            console.error("CarWheel: Radius is invalid, please set it manually or make sure the wheel is attached to a model");
            return;
        }
        this._activeRadius = Math.max(.01, radius);




        // Figure out which axis the wheel should rotate around
        // Get the rotation in car space
        // TODO: This is a bit hacky, but it works for now
        const quat = car.gameObject.worldQuaternion.clone();
        car.gameObject.worldQuaternion = new Quaternion();
        const axesDiff = new Quaternion();
        axesDiff.copy(car.gameObject.worldQuaternion)
            .multiply(target.worldQuaternion.clone().invert());
        car.gameObject.worldQuaternion = quat;


        // Create rotation axis vectors
        this.wheelModelUp = new Vector3(0, 1, 0)
            .clone()
            .applyQuaternion(axesDiff);

        this.wheelModelRight = new Vector3(1, 0, 0)
            .clone()
            .applyQuaternion(axesDiff);

        const wPos = target.worldPosition;
        const lPos = this.car.gameObject.worldToLocal(wPos);
        lPos.multiply(this.car.gameObject.worldScale);

        // Move the wheel up by half radius (assuming our component is centered to the wheel model)
        lPos.y += this._activeRadius * .5;

        const suspensionDirection = getTempVector(0, -1, 0); // Y axis
        const axleDirection = getTempVector(-1, 0, 0); // X axis

        let restLength = this.suspensionRestLength;
        if (!restLength || restLength < 0) {
            restLength = radius * .5;
        }

        let suspensionTravel = this.maxSuspensionTravel;
        if (suspensionTravel <= 0) {
            suspensionTravel = radius * .2;
        }

        this.vehicle.addWheel(lPos, suspensionDirection, axleDirection, restLength, this._activeRadius);
        this.vehicle.setWheelSuspensionStiffness(i, this.suspensionStiff);
        this.vehicle.setWheelSuspensionCompression(i, this.suspensionCompression);
        this.vehicle.setWheelSuspensionRelaxation(i, this.suspensionRelax);
        this.vehicle.setWheelMaxSuspensionForce(i, this.maxSuspensionForce);
        this.vehicle.setWheelMaxSuspensionTravel(i, suspensionTravel);
        this.vehicle.setWheelSideFrictionStiffness(i, this.sideFrictionStiffness);
        this.vehicle.setWheelFrictionSlip(i, this.frictionSlip.y);


        if (this.skidParticle) {
            this.skidParticleBehaviour = new SkidTrailBehaviour();
            this.skidParticle.addBehaviour(this.skidParticleBehaviour);
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
        let gripAmount = velocity.dot(this.car.gameObject.worldRight);
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
        const friction = Mathf.lerp(this.frictionSlip.x, this.frictionSlip.y, gripAmount);
        this.vehicle.setWheelFrictionSlip(this._wheelIndex, friction);

    }

    updateVisuals() {
        const target = this.wheelModel || this.gameObject;

        // rotation
        const wheelRot = this.vehicle.wheelRotation(this._wheelIndex)!;
        const wheelTurn = this.vehicle.wheelSteering(this._wheelIndex)!;

        const yRot = getTempQuaternion().setFromAxisAngle(this.wheelModelUp, wheelTurn);
        const xRot = getTempQuaternion().setFromAxisAngle(this.wheelModelRight, wheelRot);
        const wheelRotation = yRot.multiply(xRot);
        target.quaternion.copy(wheelRotation);

        // position
        const contact = this.vehicle.wheelContactPoint(this._wheelIndex);
        const isInContact = this.vehicle.wheelIsInContact(this._wheelIndex);
        const wheelPosition = getTempVector();
        if (contact) {
            if (debugWheel) Gizmos.DrawWireSphere(contact, .02, 0xffff55, 0, false);
            wheelPosition.copy(this.car.gameObject.worldUp).multiplyScalar(this._activeRadius);
            wheelPosition.add(contact);
            target.worldPosition = wheelPosition;
            // const wp = target.worldPosition;
            // target.worldPosition = wp.lerp(wheelPosition, this.context.time.deltaTime / .05);
        }

        // skid
        if (this.skidParticleBehaviour) {
            const sideAmount = Math.abs(this.vehicle.wheelSideImpulse(this._wheelIndex) ?? 0);
            const breakAmount = Math.abs(this.vehicle.wheelBrake(this._wheelIndex) ?? 0);

            const isSkidding = sideAmount > this.skidVisualSideThreshold || breakAmount > this.skidVisualBreakThreshold;
            const showSkid = isInContact && contact != undefined && isSkidding;

            if (this.skidParticle && contact) {
                const wPos = getTempVector(contact);
                wPos.y += this.skidParticle.main.startSize.constant / 4; // offset the effect
                this.skidParticle.worldPosition = wPos;
            }

            this.skidParticleBehaviour.isSkidding = showSkid;
        }

        // debug
        if (debugWheel) {
            const sphereSize = this._activeRadius * .1;

            // draw wheel
            const normal = getTempVector(this.car.gameObject.worldRight).multiplyScalar(-1)
            normal.applyEuler(new Euler(0, wheelTurn, 0));

            Gizmos.DrawCircle(wheelPosition, normal, this._activeRadius, 0x0000ff, 0, false);

            const inner = getTempVector(wheelPosition);
            const out = getTempVector(wheelPosition).add(getTempVector(normal).multiplyScalar(this._activeRadius));
            Gizmos.DrawLine(inner, out, 0xff0000, 0, false);
            Gizmos.DrawSphere(out, sphereSize, 0xff0000, 0, false);

            const forward = getTempVector(this.car.gameObject.worldForward)
                .multiplyScalar(this._activeRadius * 1);
            forward.applyEuler(new Euler(0, wheelTurn, 0));
            const end = getTempVector(wheelPosition).add(forward);
            Gizmos.DrawLine(wheelPosition, end, 0x0000ff, 0, false);
            Gizmos.DrawSphere(end, sphereSize, 0x0000ff, 0, false);

            // draw susnpension line
            // Gizmos.DrawLine(getTempVector(suspensionRest).add(getTempVector(right).multiplyScalar(-0.1)), getTempVector(suspensionRest).add(getTempVector(right).multiplyScalar(0.1)), 0xff0000, 0, false);
            // Gizmos.DrawLine(getTempVector(suspensionRest).add(this.up.multiplyScalar(this.suspensionTravel)), getTempVector(suspensionRest).add(this.up.multiplyScalar(-this.suspensionTravel)), 0xebd834, 0, false);
        }

    }
}

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