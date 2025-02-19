import { Behaviour, Collision, getTempQuaternion, getTempVector, Mathf, serializable } from "@needle-tools/engine";
import { CarPhysics } from "./CarPhysics";
import { Vector3, Quaternion } from "three";

export class CarController extends Behaviour {

    @serializable(CarPhysics)
    carPhysics?: CarPhysics | null;

    @serializable()
    yResetThreshold: number = -5;

    /**
     * Resets the car to the starting position and orientation
     */
    reset() {
        this.carPhysics?.teleport(this.posOnStart, this.rotOnStart, true);
    }


    private posOnStart!: Vector3;
    private rotOnStart!: Quaternion;
    private gamepad: Gamepad | null = null;

    onEnable() {
        // save start orientation
        this.posOnStart = this.gameObject.position.clone();
        this.rotOnStart = this.gameObject.quaternion.clone();
        this.carPhysics ||= this.gameObject.getComponent(CarPhysics);
        window.addEventListener("gamepadconnected", this._onGamepadConnected);
    }
    onDisable(): void {
        window.removeEventListener("gamepadconnected", this._onGamepadConnected);
    }

    private _onGamepadConnected = (event: GamepadEvent) => {
        console.debug("Gamepad connected", event.gamepad);
        this.gamepad = event.gamepad;
    }

    onBeforeRender() {
        if (this.context.input.isKeyDown("r")) {
            this.reset();
        }
        this.handleInput();
        this.resetWhenRolledOver();
        this.resetWhenFallingoff();
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

    private _lastVehicleVelocity: number = 0;
    private _lastHeroRumbleTime: number = -1;

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

        if (this.gamepad?.connected) {
            steer += this.gamepad.axes[0];
            accel += -this.gamepad.axes[1];

            const aButton = this.gamepad.buttons[0];
            const bButton = this.gamepad.buttons[1];
            const ltButton = this.gamepad.buttons[6];
            const rtButton = this.gamepad.buttons[7];

            if (aButton.pressed || rtButton.pressed) {
                accel += 1;
            }
            if (bButton.pressed || ltButton.pressed) {
                accel -= 1;
            }

            const xButton = this.gamepad.buttons[2];
            if (xButton.pressed) {
                this.reset();
            }

            const velocity = this.carPhysics.velocity.length();

            // base motor rumble
            const timeSinceHeroRumble = this.context.time.realtimeSinceStartup - this._lastHeroRumbleTime;
            if (timeSinceHeroRumble > 0.3) {
                // base motor rumble

                if (velocity > .01) {
                    this.gamepad.vibrationActuator.playEffect("dual-rumble", {
                        startDelay: 0,
                        duration: this.context.time.deltaTime,
                        weakMagnitude: .1,
                        strongMagnitude: .1,
                    });
                }

                // wheels force rumble
                const wheels = this.carPhysics.wheels;
                const maxForce = 200;
                let largestForce = 0;
                for (const wheel of wheels) {
                    const force = this.carPhysics.vehicle.wheelSuspensionForce(wheel.index);
                    // if (force != undefined) suspensionForce += force;
                    if (force && force < maxForce) {
                        const factor = 1 - (force / maxForce);
                        largestForce = Math.max(largestForce, factor);
                    }
                }
                if (largestForce > 0) {
                    const expFactor = Math.pow(largestForce, 2);
                    this.gamepad.vibrationActuator.playEffect("dual-rumble", {
                        startDelay: 0,
                        duration: largestForce * 500,
                        weakMagnitude: expFactor * 1.0,
                        strongMagnitude: expFactor * 1.0,
                    });
                }
            }

            // if the car hits something
            if (velocity) {
                const lastVelocity = this._lastVehicleVelocity;
                this._lastVehicleVelocity = velocity;
                const diff = lastVelocity - velocity;
                if (diff > 1) {
                    this._lastHeroRumbleTime = this.context.time.realtimeSinceStartup;
                    this.gamepad.vibrationActuator.playEffect("dual-rumble", {
                        startDelay: 0,
                        duration: 150,
                        weakMagnitude: Mathf.clamp01(diff / 3),
                        strongMagnitude: Mathf.clamp01(diff / 3),
                    });
                }
            }

            // get latest gamepad data
            this.gamepad = navigator.getGamepads()[this.gamepad.index];
        }

        this.carPhysics.steerInput(steer);
        this.carPhysics.accelerationInput(accel);
    }

}