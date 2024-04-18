import { DynamicRayCastVehicleController, World, Quaternion } from "@dimforge/rapier3d-compat";
import { Mathf, Player, PlayerModule, PlayerModuleType, Rigidbody, delayForFrames, getTempVector, serializable } from "@needle-tools/engine";
import { Vector3 } from "three";
import { CarWheel } from "./CarWheel";
import { CarDrive } from "./CarDrive";

export class CarPhysics extends PlayerModule {
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
    carDirve: CarDrive = CarDrive.all;

    protected vehicle!: DynamicRayCastVehicleController;
    protected rigidbody!: Rigidbody;

    protected currSteer: number = 0;
    protected currAcc: number = 0;

    protected posOnStart!: Vector3;
    protected rotOnStart!: Quaternion;

    get type() { return PlayerModuleType.physics; }

    onDynamicallyConstructed(): void {
        if (!this.rigidbody) {
            this.rigidbody = this.gameObject.addComponent(Rigidbody);
            this.rigidbody.autoMass = false;
            this.rigidbody.mass = 250;
        }

        if (this.wheels.length == 0) {
            this.wheels.push(...this.gameObject.getComponentsInChildren(CarWheel));
        }
    }

    async initialize(player: Player) {

        // get or create needle rigidbody
        this.rigidbody = this.gameObject.getComponent(Rigidbody)!;


        // await rigidbody creation
        await delayForFrames(2);        

        // get underlaying rapier rigidbody
        const r_rb = this.context.physics.engine?.getBody(this.rigidbody);
        const world = this.context.physics.engine?.world as World;

        if (!world) throw new Error("Physics engine (Rapier) not found");

        // create vehicle physics
        this.vehicle = world.createVehicleController(r_rb);

        this.vehicle.indexUpAxis = 1;
        this.vehicle.setIndexForwardAxis = 2;

        // initialize wheels
        this.wheels.forEach((wheel, i) => { 
            wheel.initialize(this, this.vehicle, i);
        });

        // save start orientation
        this.posOnStart = this.gameObject.position.clone();
        this.rotOnStart = this.gameObject.quaternion.clone();

        super.initialize(player);
    }

    steerInput(steerAmount: number) {
        steerAmount = Mathf.clamp(steerAmount, -1, 1);
        this.currSteer = Mathf.lerp(this.currSteer, steerAmount, this.steerSmoothingFactor * this.context.time.deltaTime);
    }

    accelerationInput(accelAmount: number) {
        accelAmount = Mathf.clamp(accelAmount, -1, 1);
        this.currAcc = accelAmount;
    }

    update() {
        if (!this.canUpdate) return;

        // physics
        const dt = this.context.time.deltaTime;
        this.rigidbody.wakeUp(); 
        this.applyPhysics();
        this.vehicle.updateVehicle(dt);

        // update visuals
        this.updateWheelVisual();

        this.resetWhenRolledOver();
    }

    reset() {
        this.gameObject.position.copy(this.posOnStart);
        this.gameObject.quaternion.copy(this.rotOnStart);
        this.rigidbody.resetVelocities();
        this.rigidbody.resetForces();

        this.rescueVehicle();
    }

    protected applyPhysics() {
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
        const isAccelerating = this.currAcc != 0 && !isBreaking && !reachedTopSpeed;
        if(isAccelerating)
            accelForce = this.accelerationForce * this.currAcc;

        // steer
        const steer = this.currSteer * this.maxSteer * Mathf.Deg2Rad;

        // updateWheels
        this.wheels.forEach((wheel) => {
            wheel.applyPhysics(accelForce, breakForce, steer);
        });
    }
    
    protected updateWheelVisual() {
        this.wheels.forEach((wheel) => { 
            wheel.updateVisuals();
        });
    }

    protected rolledOverDuration: number = 0;
    protected resetWhenRolledOver() {
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

    protected rescueVehicle() {
        this.gameObject.position.y += 0.4;
        this.gameObject.quaternion.setFromUnitVectors(getTempVector(0,0,1), this.gameObject.worldForward);
    }
}