import { Behaviour, Mathf, serializable } from '@needle-tools/engine';
import { CarPhysics } from './CarPhysics';

export class CarTouchControls extends Behaviour {
    @serializable(CarPhysics)
    carPhysics?: CarPhysics;

    private steerLeftState: number = 0;
    private steerRightState: number = 0;
    private throttleState: number = 0;
    private breakState: number = 0;

    update() {
        this.throttleInput();
        this.steerInput();
    }

    private throttleInput() {
        this.carPhysics?.accelerationInput(Mathf.clamp(this.throttleState + this.breakState, -1, 1));
    }

    private steerInput() {
        this.carPhysics?.steerInput(Mathf.clamp(this.steerLeftState + this.steerRightState, -1, 1));
    }

    // ---

    steerLeftPress() {
        this.steerLeftState = -1;
    }
    steerLeftRelease() {
        this.steerLeftState = 0;
    }
    steerRightPress() {
        this.steerRightState = 1;
    }
    steerRightRelease() {
        this.steerRightState = 0;
    }

    throttlePress() {
        this.throttleState = 1;
    }
    throttleRelease() {
        // do nothing
    }

    brakePress() {
        this.throttleState = 0;
        this.breakState = -1;
    }

    brakeRelease() {
        this.breakState = 0;
    }
}