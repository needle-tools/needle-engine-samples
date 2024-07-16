import { DynamicRayCastVehicleController, World, Vector, Quaternion } from "@dimforge/rapier3d-compat";
import { Behaviour, Collider, GameObject, Gizmos, Mathf, ParticleSystem, Rigidbody, foreachComponent, getComponent, getTempQuaternion, getTempVector, serializable, setWorldPosition, showBalloonMessage } from "@needle-tools/engine";
import { Vector3 } from "three";

export class CarWheel extends Behaviour {
    @serializable()
    isFront: boolean = false;

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
    frictionSlip: number = 10.5;

    @serializable()
    frictionSlipWhenBreaking: number = 0.5;

    // --- Visuals ---
    @serializable(ParticleSystem)
    skidParticle?: ParticleSystem;

    @serializable()
    skidVisualSideTreshold: number = 5;

    @serializable()
    skidVisualBreakTreshold: number = 0.1;

    //@nonSerialized
    localPosOnStart: Vector3 = new Vector3();
}

export class CarController extends Behaviour {
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

    protected vehicle!: DynamicRayCastVehicleController;
    protected rigidbody!: Rigidbody;

    protected currSteer: number = 0;
    protected currAcc: number = 0;

    protected posOnStart!: Vector3;
    protected rotOnStart!: Quaternion;
    start(): void {
        // get or create needle rigidbody
        this.rigidbody = this.gameObject.getOrAddComponent(Rigidbody);

        // get underlaying rapier rigidbody
        const r_rb = this.context.physics.engine?.getBody(this.rigidbody);
        const world = this.context.physics.engine?.world as World;

        if (!world) throw new Error("Physics engine (Rapier) not found");

        // create vehicle physics
        this.vehicle = world.createVehicleController(r_rb);

        this.vehicle.indexUpAxis = 1;
        this.vehicle.setIndexForwardAxis = 2;

        // create wheels
        this.wheels.forEach((wheel, i) => { 
            const wPos = wheel.worldPosition;
            const rPos = this.gameObject.worldToLocal(wPos);
            const rDir = getTempVector(0,-1,0);

            const wAxis = wheel.gameObject.worldRight.negate();
            const rAxis = this.gameObject.worldToLocal(wAxis);

            wheel.localPosOnStart.copy(rPos);
            this.vehicle.addWheel(rPos, rDir, rAxis, wheel.suspensionRestLength, wheel.radius);

            this.vehicle.setWheelSuspensionCompression(i, wheel.suspensionCompression);
            this.vehicle.setWheelSuspensionRelaxation(i, wheel.suspensionRelax);
            this.vehicle.setWheelSuspensionStiffness(i, wheel.suspensionStiff);
            this.vehicle.setWheelMaxSuspensionForce(i, wheel.suspensionForce);
            this.vehicle.setWheelMaxSuspensionTravel(i, wheel.suspensionTravel);

            this.vehicle.setWheelSideFrictionStiffness(i, wheel.sideFrictionStiffness);
            this.vehicle.setWheelFrictionSlip(i, wheel.frictionSlip);
        });

        // save start orientation
        this.posOnStart = this.gameObject.position.clone();
        this.rotOnStart = this.gameObject.quaternion.clone();
    }

    update() {
        // get input and set forces
        this.handleInput();
        
        //don't ever sleep 
        this.rigidbody.wakeUp(); 

        // update vehicle physics
        const dt = this.context.time.deltaTime;
        this.vehicle.updateVehicle(dt);

        // update visuals
        this.updateWheelVisual();

        // reset car
        const reset = this.context.input.isKeyDown("r");
        if (reset) {
            this.gameObject.position.copy(this.posOnStart);
            this.gameObject.quaternion.copy(this.rotOnStart);
            this.rigidbody.resetVelocities();
            this.rigidbody.resetForces();
        }

        this.resetWhenRolledOver(reset);
    }

    protected handleInput() {
        const input = this.context.input;
        const dt = this.context.time.deltaTime;

        // acceleration
        let v = 0;
        if(input.isKeyPressed("w")) v = 1;
        if(input.isKeyPressed("s")) v = -1;

        this.currAcc = v;

        // steering
        let h = 0;
        if(input.isKeyPressed("a")) h = 1;
        if(input.isKeyPressed("d")) h = -1;

        this.currSteer = Mathf.lerp(this.currSteer, h, this.steerSmoothingFactor * dt);
        
        // set forces based on input
        this.wheels.forEach((wheel, i) => { 
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

            // aceeleration
            accelForce = this.accelerationForce * this.currAcc;
            const isAccelerating = this.currAcc != 0 && !isBreaking && !reachedTopSpeed;

            this.vehicle.setWheelBrake(i, isBreaking ? breakForce : 0);
            this.vehicle.setWheelEngineForce(i, isAccelerating ? accelForce : 0);

            // steer
            if (wheel.isFront/*  && !isBreaking */) {
                this.vehicle.setWheelSteering(i, this.currSteer * this.maxSteer * Mathf.Deg2Rad);
            }

            // slip
            this.vehicle.setWheelFrictionSlip(i, isBreaking ? wheel.frictionSlipWhenBreaking : wheel.frictionSlip)
        });
    }

    protected refRight = new Vector3(1, 0, 0);
    protected refUp = new Vector3(0, 1, 0);
    protected updateWheelVisual() {
        this.wheels.forEach((wheel, i) => { 
            // rotation
            const wheelAngle = this.vehicle.wheelRotation(i)!;

            const steer = this.currSteer * this.maxSteer * Mathf.Deg2Rad;
            const yRot = getTempQuaternion().setFromAxisAngle(this.refUp, wheel.isFront ? steer : 0);
            const xRot = getTempQuaternion().setFromAxisAngle(this.refRight, wheelAngle);

            const rot = yRot.multiply(xRot);

            wheel.gameObject.quaternion.copy(rot);
            
            // position
            const contact = this.rapierVectorToThreeVector(this.vehicle.wheelContactPoint(i) as Vector);
            if (contact) {
                const wheelPos = getTempVector(contact).addScaledVector(this.up, wheel.radius);
                setWorldPosition(wheel.gameObject, wheelPos);
            }

            // skid
            const sideAmount = Math.abs(this.vehicle.wheelSideImpulse(i) ?? 0);
            const breakAmount = Math.abs(this.vehicle.wheelBrake(i) ?? 0);
            const showSkid = sideAmount > wheel.skidVisualSideTreshold || breakAmount > wheel.skidVisualBreakTreshold;
            if (this.vehicle.wheelIsInContact(i) && showSkid) {
                if (wheel.skidParticle && contact) {
                    setWorldPosition(wheel.skidParticle.gameObject, contact);
                    wheel.skidParticle?.emit(1);
                }
            }
        });
    }

    protected rapierVectorToThreeVector(v: Vector | null): Vector3 | undefined{ 
        if(v == null) return undefined;
        return getTempVector(v.x, v.y, v.z);
    }

    protected rolledOverDuration: number = 0;
    protected resetWhenRolledOver(force: boolean = false) {
        const isRolledOver = this.gameObject.worldUp.dot(getTempVector(0, 1, 0)) < 0.65;
        const isSlow = this.rigidbody.getVelocity().length() < 0.1;
        if (isRolledOver && isSlow) {
            this.rolledOverDuration += this.context.time.deltaTime;
        }
        else {
            this.rolledOverDuration = 0;
        }

        if (this.rolledOverDuration > 1 || force) {
            this.gameObject.position.y += 0.4;
            this.gameObject.quaternion.setFromUnitVectors(getTempVector(0,0,1), this.gameObject.worldForward);
        }
    }
}