import { Behaviour, getTempQuaternion, getTempVector, Mathf, serializable } from "@needle-tools/engine";
import { CarPhysics } from "./CarPhysics";
import { Vector3, Quaternion } from "three";
import { RigidBody } from "@dimforge/rapier3d-compat";



export class CarController extends Behaviour {

    @serializable(CarPhysics)
    carPhysics?: CarPhysics | null;

    @serializable()
    yResetThreshold: number = -5;


    private posOnStart!: Vector3;
    private rotOnStart!: Quaternion;

    onEnable() {
        // save start orientation
        this.posOnStart = this.gameObject.position.clone();
        this.rotOnStart = this.gameObject.quaternion.clone();
        this.carPhysics = this.carPhysics || this.gameObject.getComponent(CarPhysics);
    }

    onBeforeRender() {
        if (this.context.input.isKeyDown("r")) {
            this.reset();
        }
        this.handleInput();
        this.resetWhenRolledOver();
        this.resetWhenFallingoff();
    }

    reset() {
        this.carPhysics?.teleport(this.posOnStart, this.rotOnStart, true);
    }

    private resetWhenFallingoff() {
        if (this.worldPosition.y < this.yResetThreshold) {
            this.reset();
        }
    }

    private rolledOverDuration: number = 0;
    private resetWhenRolledOver() {
        if (!this.carPhysics) return;

        const isRolledOver = this.gameObject.worldUp.dot(getTempVector(0, 1, 0)) < 0.65;
        const velocity = this.carPhysics.rigidbody.getVelocity();
        const isSlow = velocity.length() < 0.1;

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
        if (!this.carPhysics) return;

        const pos = this.worldPosition;
        pos.y += 1;

        const fwd = this.forward;
        fwd.y = 0;
        fwd.normalize();

        const rot = getTempQuaternion().setFromUnitVectors(getTempVector(0, 0, -1), fwd);

        this.carPhysics.teleport(pos, rot);
    }

    private handleInput() {
        if (!this.carPhysics) return;

        let steer = 0;
        let accel = 0;

        if (this.context.xr) {
            accel += this.context.xr.rightController?.getButton("a-button")?.value || 0;
            accel -= this.context.xr.leftController?.getButton("x-button")?.value || 0;

            const squeezeLeft = this.context.xr.rightController?.getButton("xr-standard-squeeze")?.value || 0;
            const squeezeRight = this.context.xr.leftController?.getButton("xr-standard-squeeze")?.value || 0;
            if (squeezeLeft > .5 && squeezeRight > .5) {
                const yDiff = this.context.xr.leftController!.gripPosition.y - this.context.xr.rightController!.gripPosition.y;
                steer = Mathf.clamp(yDiff, -2, 2);
            }
        }
        else {
            if (this.context.input.isKeyPressed("a")) {
                steer -= 1;
            }
            else if (this.context.input.isKeyPressed("d")) {
                steer += 1;
            }

            if (this.context.input.isKeyPressed("s")) {
                accel -= 1;
            }
            if (this.context.input.isKeyPressed("w")) {
                accel += 1;
            }
        }

        this.carPhysics.steerInput(steer);
        this.carPhysics.accelerationInput(accel);
    }

}