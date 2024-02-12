import { DynamicRayCastVehicleController, World, Vector } from "@dimforge/rapier3d-compat";
import { Behaviour, Collider, GameObject, Gizmos, Rigidbody, getComponent, getTempQuaternion, getTempVector, serializable, setWorldPosition } from "@needle-tools/engine";
import { Vector3 } from "three";

export class CarWheel extends Behaviour {
    @serializable()
    isFront: boolean = false;

    @serializable(GameObject)
    axelRef!: GameObject;

    @serializable()
    radius: number = 1;

    @serializable()
    suspension: number = 1;

    @serializable()
    maxSusspensionForce: number = 20;

    //@nonSerialized
    localPosOnStart: Vector3 = new Vector3();
}

export class CarController extends Behaviour {
    @serializable(CarWheel)
    wheels: CarWheel[] = [];

    @serializable()
    speed: number = 10;

    @serializable()
    steer: number = 10;

    private vehicle?: DynamicRayCastVehicleController;
    private rigidbody?: Rigidbody;

    private refFwd = new Vector3(0, 0, 1);
    start(): void {
        let n_rb = this.gameObject.getComponent(Rigidbody);
        n_rb ??= this.gameObject.addNewComponent(Rigidbody)!;
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

            const wDir = wheel.forward;
            const rDir = this.gameObject.worldToLocal(wDir);

            const wAxis = wheel.gameObject.worldRight;
            const rAxis = this.gameObject.worldToLocal(wAxis);

            //Gizmos.DrawLine(this.worldPosition, wheel.worldPosition, "red", 5, false);
            //Gizmos.DrawSphere(wheel.worldPosition, 0.1, "red", 5, false);
            wheel.localPosOnStart.copy(rPos);
            this.vehicle?.addWheel(rPos, rDir, rAxis, wheel.suspension, wheel.radius);

            // slip
            //this.vehicle?.setWheelFrictionSlip(i, 0);
            this.vehicle?.setWheelMaxSuspensionForce(i, wheel.maxSusspensionForce);
        });
    }

    update() {
        this.handleInput();

        // ?
        this.wheels.forEach((wheel, i) => { 
            this.vehicle?.setWheelChassisConnectionPointCs(i, wheel.localPosOnStart);
        });
        
        const dt = this.context.time.deltaTime;
        this.vehicle?.updateVehicle(dt);

        this.updateWheelVisual();
    }

    private handleInput() {
        const input = this.context.input;

        let v = 0;
        if(input.isKeyPressed("w")) v = -1;
        if(input.isKeyPressed("s")) v = 1;

        let h = 0;
        if(input.isKeyPressed("a")) h = 1;
        if(input.isKeyPressed("d")) h = -1;

        
        this.wheels.forEach((wheel, i) => { 
            if (wheel.isFront) {
                this.vehicle?.setWheelSteering(i, h * this.steer);
                const debugPos = wheel.worldPosition;
                debugPos.y += 1;
                Gizmos.DrawLabel(debugPos, (this.vehicle?.wheelSteering(i) ?? 0).toFixed(1), 0.1, 0, 0xffffff, 0x000000);
            }
            else {
                const s = v * this.speed * (this.rigidbody?.mass ?? 1);
                this.vehicle?.setWheelEngineForce(i, s);
            }
        });
    }

    private refRight = new Vector3(1, 0, 0);
    private updateWheelVisual() {
        this.wheels.forEach((wheel, i) => { 
            // rot
            const rot = this.vehicle?.wheelRotation(i)!;
            const dir = this.vehicle?.wheelDirectionCs(i)!;

            const xRot = getTempQuaternion().setFromAxisAngle(this.refRight, rot);
            const yRot = getTempQuaternion().setFromUnitVectors(this.refFwd, getTempVector(dir.x, dir.y, dir.z));

            wheel.gameObject.quaternion.copy(xRot/* .multiply(yRot) */);
            
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
                Gizmos.DrawLine(wheel.worldPosition, vec, "red", 0, false);
                Gizmos.DrawSphere(vec, .1, "red", 0, false);

                const pos = getTempVector(wheel.worldPosition);
                pos.y += wheel.radius;
                Gizmos.DrawLabel(pos, );
            }
        });
    }

    private rapierVectorToThreeVector(v: Vector): Vector3 { 
        return getTempVector(v.x, v.y, v.z);
    }
}