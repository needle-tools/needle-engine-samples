import { Mathf, PlayerModule, PlayerModuleType, serializable } from '@needle-tools/engine';
import { CarInput_Scheme } from './CarInput_Scheme';

export class CarTouchControls extends PlayerModule {

    get type() { return PlayerModuleType.input; }

    get inputData() { return this.frameData as CarInput_Scheme; }
    get input() { return this.context.input; }

    protected steerLeftState: number = 0;
    protected steerRightState: number = 0;
    protected throttleState: number = 0;
    protected breakState: number = 0;

    updateInput() {
        this.throttleInput();
        this.steerInput();
        this.resetInput();
    }

    protected throttleInput() {
        this.inputData.throttle ??= 0;
        this.inputData.throttle += this.throttleState + this.breakState;
        this.inputData.throttle = Mathf.clamp(this.inputData.throttle, -1, 1);
    }

    protected steerInput() {
        this.inputData.steer ??= 0;
        this.inputData.steer += this.steerLeftState + this.steerRightState;
        this.inputData.steer = Mathf.clamp(this.inputData.steer, -1, 1);
    }

    protected resetInput() {
        //this.inputData.reset ??= false;
        //this.inputData.reset ||= this.input.getPointerLongPress(0) && this.input.getIsTouch(0);
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