import { Player } from "@needle-tools/engine";
import { CarKeyControls } from "./Input/CarKeyControls";
import { CarPhysics } from "./Physics/CarPhysics";
import { CarInput_Scheme } from "./Input/CarInput_Scheme";

export class CarPlayer extends Player {
    get inputData() { return this.frameData as CarInput_Scheme; }

    protected phyiscs!: CarPhysics;

    protected initialize(findModules?: boolean): void {
        this.phyiscs = this.ensureModule(CarPhysics);
        this.ensureModule(CarKeyControls);

        super.initialize(findModules);
    }

    update() {
        super.update();
        if (!this.isInitialized) return;

        this.phyiscs.accelerationInput(this.inputData.throttle ?? 0);
        this.phyiscs.steerInput(this.inputData.steer ?? 0);

        if (this.inputData.reset ?? false) {
            this.phyiscs.reset();
        }
    }
}