import { Behaviour, serializable, setParam, setParamWithoutReload } from "@needle-tools/engine";

export class PerformanceSettings extends Behaviour {
    @serializable()
    clampFrameRate: boolean = true;
    private _clampFrameRate: boolean = false;

    @serializable()
    maxFrameRate: number = 72;
    private _maxFrameRate: number = -1024;

    update() {
        if(this._clampFrameRate !== this.clampFrameRate || this._maxFrameRate !== this.maxFrameRate) {
            const a = this.clampFrameRate ? this.maxFrameRate : undefined;
            this.context.targetFrameRate = a;

            this._clampFrameRate = this.clampFrameRate;
            this._maxFrameRate = this.maxFrameRate;
        }
    }

    setTarget(newTarget: number) {
        this.maxFrameRate = newTarget;
        this.clampFrameRate = true;
    }

    setClamping(newState: boolean) {
        this.clampFrameRate = newState;
    }
}