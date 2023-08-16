import { Behaviour, serializable } from "@needle-tools/engine";

export class PerformanceSettings extends Behaviour {
    @serializable()
    clampFrameRate: boolean = true;
    private _clampFrameRate: boolean = false;

    @serializable()
    maxFrameRate: number = 60;
    private _maxFrameRate: number = -1024;
    
    start() {
    }

    update() {
        if(this._clampFrameRate !== this.clampFrameRate || this._maxFrameRate !== this.maxFrameRate) {

            this.context.targetFrameRate = this.clampFrameRate ? this.maxFrameRate : undefined;

            this.clampFrameRate = this._clampFrameRate;
            this.maxFrameRate = this._maxFrameRate;
        }
    }
}