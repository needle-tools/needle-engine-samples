import { Mathf, PlayerModule, PlayerModuleType, serializable } from '@needle-tools/engine';
import { CarInput_Scheme } from './CarInput_Scheme';

export class CarKeyControls extends PlayerModule {

    get type() { return PlayerModuleType.input; }

    get inputData() { return this.frameData as CarInput_Scheme; }
    get input() { return this.context.input; }

    @serializable()
    throttleKey: string[] = [ "w", "ArrowUp" ];

    @serializable()
    brakeKey: string[] = [ "s", "ArrowDown" ];

    @serializable()
    steerLeftKey: string[] = [ "a", "ArrowLeft" ];

    @serializable()
    steerRightKey: string[] = [ "d", "ArrowRight" ];

    @serializable()
    resetKey: string[] = [ "r", "Backspace" ];

    updateInput(): void {
        this.throttleInput();
        this.steerInput();
        this.resetInput();
    }    

    protected throttleInput() {
        this.inputData.throttle ??= 0;

        if (this.areKeysPressed(this.throttleKey)) {
            this.inputData.throttle += 1;
        }
        if (this.areKeysPressed(this.brakeKey)) {
            this.inputData.throttle -= 1;
        }
        
        this.inputData.throttle = Mathf.clamp(this.inputData.throttle, -1, 1);
    }

    protected steerInput() {
        this.inputData.steer ??= 0;

        if (this.areKeysPressed(this.steerLeftKey)) {
            this.inputData.steer -= 1;
        }
        if (this.areKeysPressed(this.steerRightKey)) {
            this.inputData.steer += 1;
        }

        this.inputData.steer = Mathf.clamp(this.inputData.steer, -1, 1);
    }

    protected resetInput() {
        this.inputData.reset ??= false;
        this.inputData.reset ||= this.areKeysPressed(this.resetKey);
    }

    // ---- helper functions ----

    protected areKeysPressed(keys: string[]): boolean {
        for (const i in keys) {
            const key = keys[i];
            if (this.input.isKeyPressed(key)) {
                return true;
            }
        }

        return false;
    }
    protected areKeysDown(keys: string[]): boolean {
        for (const i in keys) {
            const key = keys[i];
            if (this.input.isKeyDown(key)) {
                return true;
            }
        }

        return false;
    }
}