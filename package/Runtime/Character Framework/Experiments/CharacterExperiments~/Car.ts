import { Rigidbody, Mathf, getTempVector, Player, POVCamera, PersonMode, DesktopCharacterInput, CommonCharacterInput_Scheme, CharacterPhysics_Scheme, serializable, GameObject } from "@needle-tools/engine";

import { Vector3, Quaternion } from "three";

export class Car extends Player {

    @serializable()
    public speed: number = 10;

    @serializable()
    car?: GameObject;

    awake(): void {
        super.awake();

        this.ensureModule(POVCamera, mod => {
            mod.distance.x = 2;
            mod.distance.y = 8;
            mod.switchPerson(PersonMode.ThirdPerson);
            mod.lookSensitivity = 0;
            mod.setLook(Math.PI / 4);
            console.log(mod);
        });

        this.ensureModule(DesktopCharacterInput);

        if(this.car) {
            this.car.parent = this.gameObject.parent;
        }
    }

    protected initialize(findModules?: boolean): void {
        super.initialize(findModules);
    }

    private x: number = 0;
    private y: number = 0;
    update(): void {
        super.update();

        const dt = this.context.time.deltaTime;
        const inputState = this.frameState as CommonCharacterInput_Scheme;
        const physicsState = this.state as CharacterPhysics_Scheme;

        const dx = inputState?.moveDeltaX ?? 0;
        const dy = inputState?.moveDeltaY ?? 0;

        // add or decay
        if(dx == 0)
            this.x = Mathf.lerp(this.x, 0, dt * this.speed);
        else
            this.x += dx * this.speed;

        if(dy == 0)
            this.y = Mathf.lerp(this.y, 0, dt * this.speed);
        else
            this.y += dy * this.speed;

        if(!physicsState.characterDirection) return;

        const q = new Quaternion().setFromUnitVectors(getTempVector().set(0, 0, 1), physicsState.characterDirection);
        const v = new Vector3(this.y, 0, this.x).applyQuaternion(q);

        const rb = this.gameObject.getComponent(Rigidbody)!;
        if(rb) {
            rb.setAngularVelocity(v.x * dt, 0, v.z * dt);
        }

        if(this.car) {
            const pos = this.gameObject.worldPosition;
            pos.y -= 0.5;

            this.car.worldPosition = pos;

            const vel = rb.getVelocity();
            vel.y = 0;
            vel.normalize();

            const q = new Quaternion().setFromUnitVectors(getTempVector().set(0, 0, 1), vel);
            this.car.worldQuaternion = q;
        }
    }
}