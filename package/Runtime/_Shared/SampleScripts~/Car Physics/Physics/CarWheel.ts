import { Behaviour, Gizmos, Mathf, ParticleSystem, ParticleSystemBaseBehaviour, QParticle, Renderer, getTempQuaternion, getTempVector, getWorldDirection, serializable, setWorldPosition } from "@needle-tools/engine";
import { DynamicRayCastVehicleController, Vector } from "@dimforge/rapier3d-compat";
import { Vector3, Vector2, Object3D } from "three";
import { TrailParticle, RecordState } from "three.quarks";
import { CarAxle } from "./CarAxle";
import { CarPhysics } from "./CarPhysics";
import { CarDrive } from "./CarDrive";

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

    protected skidParticleBehaviour?: SkidTrailBehaviour;

    protected refRight = new Vector3(1, 0, 0);
    protected refUp = new Vector3(0, 1, 0);

    protected wheelModelRight!: Vector3;
    protected wheelModelUp!: Vector3;

    protected car!: CarPhysics;
    protected vehicle!: DynamicRayCastVehicleController;
    protected wheelIndex: number = -1;
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
        this.vehicle.setWheelMaxSuspensionForce(i, this.suspensionForce);
        this.vehicle.setWheelMaxSuspensionTravel(i, this.suspensionTravel);

        this.vehicle.setWheelSideFrictionStiffness(i, this.sideFrictionStiffness);
        this.vehicle.setWheelFrictionSlip(i, this.frictionSlip.y);

        if(this.skidParticle) {
            this.skidParticleBehaviour = new SkidTrailBehaviour();
            this.skidParticle.addBehaviour(this.skidParticleBehaviour);
        }
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
        const contact = CarWheel.rapierVectorToThreeVector(this.vehicle.wheelContactPoint(this.wheelIndex) as Vector);
        if (contact) {
            const wPos = getTempVector(this.car.gameObject.worldUp).multiplyScalar(this.radius).add(contact);
            setWorldPosition(target, getTempVector(wPos.x, wPos.y, wPos.z));
        }

        // skid
        const sideAmount = Math.abs(this.vehicle.wheelSideImpulse(this.wheelIndex) ?? 0);
        const breakAmount = Math.abs(this.vehicle.wheelBrake(this.wheelIndex) ?? 0);
        const isSkidding = sideAmount > this.skidVisualSideTreshold || breakAmount > this.skidVisualBreakTreshold;
        const showSkid = this.vehicle.wheelIsInContact(this.wheelIndex) && contact && isSkidding;
        
        if (this.skidParticle) {
            const wPos = getTempVector(contact);
            wPos.y += this.skidParticle.main.startSize.constant / 4; // offset the effect
            this.skidParticle.worldPosition = wPos;
        }

        if (this.skidParticleBehaviour) {
            this.skidParticleBehaviour.isSkidding = showSkid;
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

// @nonSerializable
export class SkidTrailBehaviour extends ParticleSystemBaseBehaviour {
    isSkidding: boolean = false;

    update(particle: QParticle, _delta: number): void {
        if(this.system.trails?.enabled && particle instanceof TrailParticle) {
            // the most new particle wouldn't get affected
            if (!this.isSkidding)
                particle.color.setW(0);

            let tail = particle.previous.tail;
            while(tail && tail.hasPrev()) {
                const myTail = tail as any;                
                if (myTail.data["isSkidding"] === undefined) {
                    myTail.data["isSkidding"] = this.isSkidding;
                }

                if(myTail.data["isSkidding"] === false) {
                    tail!.data.color.setW(0);
                }
                tail = tail!.prev;
            }
        }
    }
}