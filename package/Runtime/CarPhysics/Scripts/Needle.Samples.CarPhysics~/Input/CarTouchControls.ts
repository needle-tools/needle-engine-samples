import { Mathf, PlayerModule, PlayerModuleType, serializable } from '@needle-tools/engine';
import { CarInput_Scheme } from './CarInput_Scheme';

export class CarKeyControls extends PlayerModule {

    get type() { return PlayerModuleType.input; }

    get inputData() { return this.frameData as CarInput_Scheme; }
    get input() { return this.context.input; }

    updateInput() {
        this.inputData.throttle ??= 0;
        this.inputData.steer ??= 0;

        

        this.inputData.throttle = Mathf.clamp(this.inputData.throttle, -1, 1);
        this.inputData.steer = Mathf.clamp(this.inputData.steer, -1, 1);
    }
}