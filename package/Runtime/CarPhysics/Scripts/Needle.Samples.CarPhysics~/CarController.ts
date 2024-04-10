import { DynamicRayCastVehicleController, World, Vector } from "@dimforge/rapier3d-compat";
import { Behaviour, Collider, GameObject, Gizmos, Mathf, Rigidbody, getComponent, getTempQuaternion, getTempVector, serializable, setWorldPosition, showBalloonMessage } from "@needle-tools/engine";
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

    //@nonSerialized
    localPosOnStart: Vector3 = new Vector3();
}

export class CarController extends Behaviour {
    @serializable(CarWheel)
    wheels: CarWheel[] = [];

    @serializable()
    speed: number = 10;

    @serializable()
    maxSteer: number = 0.35; // 40 degrees

    private vehicle?: DynamicRayCastVehicleController;
    private rigidbody?: Rigidbody;

    private currSteer: number = 0;
    private currAcc: number = 0;
    start(): void {
        let n_rb = this.gameObject.getComponent(Rigidbody);
        n_rb ??= this.gameObject.addComponent(Rigidbody);
        this.rigidbody = n_rb;

        const r_rb = this.context.physics.engine?.getBody(n_rb);
        const world = this.context.physics.engine?.world as World;

        if (!world) throw new Error("Physics engine (Rapier) not found");

        this.vehicle = world.createVehicleController(r_rb);

        this.vehicle.indexUpAxis = 1;
        this.vehicle.setIndexForwardAxis = 2;

        this.wheels.forEach((wheel, i) => { 
            const wPos = wheel.worldPosition;
            const rPos = this.gameObject.worldToLocal(wPos);
            const rDir = getTempVector(0,-1,0);

            const wAxis = wheel.gameObject.worldRight;
            const rAxis = this.gameObject.worldToLocal(wAxis);

            //showBalloonMessage(`${rDir.x.toFixed(1)}, ${rDir.y.toFixed(1)}, ${rDir.z.toFixed(1)}`);
            //Gizmos.DrawLine(this.worldPosition, wheel.worldPosition, "red", 5, false);
            //Gizmos.DrawSphere(wheel.worldPosition, 0.1, "red", 5, false);
            wheel.localPosOnStart.copy(rPos);
            this.vehicle?.addWheel(rPos, rDir, rAxis, wheel.suspensionRestLength, wheel.radius);

            this.vehicle?.setWheelSuspensionCompression(i, wheel.suspensionCompression);
            this.vehicle?.setWheelSuspensionRelaxation(i, wheel.suspensionRelax);
            this.vehicle?.setWheelSuspensionStiffness(i, wheel.suspensionStiff);
            this.vehicle?.setWheelMaxSuspensionForce(i, wheel.suspensionForce);
            this.vehicle?.setWheelMaxSuspensionTravel(i, wheel.suspensionTravel);


            /* const compression = this.vehicle?.wheelSuspensionCompression(i);
            const length = this.vehicle?.wheelSuspensionLength(i);
            const relax = this.vehicle?.wheelSuspensionRelaxation(i);
            const rest = this.vehicle?.wheelSuspensionRestLength(i);
            const stiff = this.vehicle?.wheelSuspensionStiffness(i);
            const force = this.vehicle?.wheelMaxSuspensionForce(i);
            const travel = this.vehicle?.wheelMaxSuspensionTravel(i); */
            /* console.log(`Wheel ${i}: compression: ${compression}, length: ${length}, relax: ${relax}, rest: ${rest}, stiff: ${stiff}, force: ${force}, travel: ${travel}`); */

        });
    }

    private hasResetAfterFirstUpdate = false;
    update() {
        this.handleInput();

        // ?
        this.wheels.forEach((wheel, i) => { 
            this.vehicle?.setWheelChassisConnectionPointCs(i, wheel.localPosOnStart);
        });
        
        const dt = this.context.time.deltaTime;
        this.vehicle?.updateVehicle(dt);

        if (!this.hasResetAfterFirstUpdate) {
            this.hasResetAfterFirstUpdate = true;
            this.rigidbody?.resetForces();
            this.rigidbody?.resetVelocities();
        }

        this.updateWheelVisual();

        this.rigidbody?.wakeUp(); //don't sleep, ever
    }

    private handleInput() {
        const input = this.context.input;
        const dt = this.context.time.deltaTime;

        let v = 0;
        if(input.isKeyPressed("w")) v = -1;
        if(input.isKeyPressed("s")) v = 1;

        this.currAcc = v; //Mathf.lerp(this.currAcc, v, 0.5 * dt);

        let h = 0;
        if(input.isKeyPressed("a")) h = 1;
        if(input.isKeyPressed("d")) h = -1;

        this.currSteer = Mathf.lerp(this.currSteer, h, 5 * dt);
        
        this.wheels.forEach((wheel, i) => { 
            if (wheel.isFront) {
                this.vehicle?.setWheelSteering(i, this.currSteer * this.maxSteer);
                /* const debugPos = wheel.worldPosition;
                debugPos.y += 1;
                Gizmos.DrawLabel(debugPos, (this.vehicle?.wheelSteering(i) ?? 0).toFixed(1), 0.1, 0, 0xffffff, 0x000000); */
            }

            const s = this.currAcc * this.speed * (this.rigidbody?.mass ?? 1);
            this.vehicle?.setWheelEngineForce(i, s);
        });
    }

    private refRight = new Vector3(1, 0, 0);
    private refUp = new Vector3(0, 1, 0);
    private updateWheelVisual() {
        this.wheels.forEach((wheel, i) => { 
            // rot
            const wheelAngle = this.vehicle?.wheelRotation(i)!;

            const steer = this.currSteer * this.maxSteer;
            const yRot = getTempQuaternion().setFromAxisAngle(this.refUp, wheel.isFront ? steer : 0);
            const xRot = getTempQuaternion().setFromAxisAngle(this.refRight, wheelAngle);

            const rot = yRot.multiply(xRot);

            wheel.gameObject.quaternion.copy(rot);
            
            // pos
            const contact = this.vehicle?.wheelContactPoint(i) as Vector;
            
            if (contact) {
                const vec = this.rapierVectorToThreeVector(contact);
                vec.addScaledVector(this.up, wheel.radius);
                setWorldPosition(wheel.gameObject, vec);
            }

            const wheelSlot = this.vehicle?.wheelChassisConnectionPointCs(i);
            if (wheelSlot) {
                const vec = this.rapierVectorToThreeVector(wheelSlot);
                this.gameObject.localToWorld(vec);
                /* Gizmos.DrawLine(wheel.worldPosition, vec, "red", 0, false);
                Gizmos.DrawSphere(vec, .1, "red", 0, false); */

                /* const pos = getTempVector(wheel.worldPosition);
                pos.y += wheel.radius; */
                //Gizmos.DrawLabel(pos, );
            }
        });
    }

    private rapierVectorToThreeVector(v: Vector): Vector3 { 
        return getTempVector(v.x, v.y, v.z);
    }
}