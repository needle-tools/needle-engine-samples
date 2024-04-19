import { Behaviour, Gizmos, Mathf, ParticleSystem, Renderer, getTempQuaternion, getTempVector, serializable, setWorldPosition } from "@needle-tools/engine";
import { Vector3, Vector2 } from "three";
import { CarAxle } from "./CarAxle";
import { DynamicRayCastVehicleController, Vector } from "@dimforge/rapier3d-compat";
import { CarPhysics } from "./CarPhysics";
import { CarDrive } from "./CarDrive";

export class CarWheel extends Behaviour {
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
    suspensionForce: number = 6000;
    @serializable()
    suspensionTravel: number = 5;

    // --- Friction ---
    @serializable()
    sideFrictionStiffness: number = 0.5;

    @serializable()
    frictionSlip: Vector2 = new Vector2(2, 10.5);

    // --- Visuals ---
    @serializable(ParticleSystem)
    skidParticle?: ParticleSystem;

    @serializable()
    skidVisualSideTreshold: number = 5;

    @serializable()
    skidVisualBreakTreshold: number = 0.1;


    protected car!: CarPhysics;
    protected vehicle!: DynamicRayCastVehicleController;
    protected wheelIndex: number = -1;
    initialize(car: CarPhysics, vehicle: DynamicRayCastVehicleController, i: number) {
        this.car = car;
        this.vehicle = vehicle;
        this.wheelIndex = i;

        const wPos = this.worldPosition;
        const rPos = this.car.gameObject.worldToLocal(wPos);
        
        const suspensionDirection = getTempVector(0,-1,0);
        const axleDirection = getTempVector(-1, 0, 0);

        this.vehicle.addWheel(rPos, suspensionDirection, axleDirection, this.suspensionRestLength, this.radius);

        this.vehicle.setWheelSuspensionCompression(i, this.suspensionCompression);
        this.vehicle.setWheelSuspensionRelaxation(i, this.suspensionRelax);
        this.vehicle.setWheelSuspensionStiffness(i, this.suspensionStiff);
        this.vehicle.setWheelMaxSuspensionForce(i, this.suspensionForce);
        this.vehicle.setWheelMaxSuspensionTravel(i, this.suspensionTravel);

        this.vehicle.setWheelSideFrictionStiffness(i, this.sideFrictionStiffness);
        this.vehicle.setWheelFrictionSlip(i, this.frictionSlip.y);
    }

    protected refRight = new Vector3(1, 0, 0);
    protected refUp = new Vector3(0, 1, 0);
    updateVisuals() {
        // rotation
        const wheelRotX = this.vehicle.wheelRotation(this.wheelIndex)!;
        const wheelRotY = this.vehicle.wheelSteering(this.wheelIndex)!;

        const yRot = getTempQuaternion().setFromAxisAngle(this.refUp, wheelRotY);
        const xRot = getTempQuaternion().setFromAxisAngle(this.refRight, wheelRotX);

        const rot = yRot.multiply(xRot);

        this.gameObject.quaternion.copy(rot);
        
        // position
        const contact = CarWheel.rapierVectorToThreeVector(this.vehicle.wheelContactPoint(this.wheelIndex) as Vector);
        if (contact) {
            const wPos = getTempVector(this.car.gameObject.worldUp).multiplyScalar(this.radius).add(contact);
            this.setWorldPosition(wPos.x, wPos.y, wPos.z);
        }

        // skid
        const sideAmount = Math.abs(this.vehicle.wheelSideImpulse(this.wheelIndex) ?? 0);
        const breakAmount = Math.abs(this.vehicle.wheelBrake(this.wheelIndex) ?? 0);
        const showSkid = sideAmount > this.skidVisualSideTreshold || breakAmount > this.skidVisualBreakTreshold;
        if (this.vehicle.wheelIsInContact(this.wheelIndex) && showSkid) {
            if (this.skidParticle && contact) {
                const wPos = getTempVector(contact);
                wPos.y += 0.05; // offset the effect
                this.skidParticle.worldPosition = wPos;
                this.skidParticle?.emit(1);
            }
        }
    }

    applyPhysics(acceleration: number, breaking: number, steeringRad: number) {
        const isOnDrivingAxel = (this.car.carDirve == CarDrive.front && this.axle == CarAxle.front) ||
                                (this.car.carDirve == CarDrive.rear && this.axle == CarAxle.rear) ||
                                this.car.carDirve == CarDrive.all;

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

    
    static rapierVectorToThreeVector(v: Vector | null): Vector3 | undefined{ 
        if(v == null) return undefined;
        return getTempVector(v.x, v.y, v.z);
    }
}
