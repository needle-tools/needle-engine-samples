import { DesktopCharacterInput } from "@needle-tools/engine";
import { ShootingRangeCharacterInput_Scheme } from "./ShootingRangeCharacterInput_Scheme";

export class DesktopShootingRangeControls extends DesktopCharacterInput {

    protected override get inputData(): ShootingRangeCharacterInput_Scheme {
        return this.frameData as ShootingRangeCharacterInput_Scheme;
    }

    override updateInput(): void {
        super.updateInput();

        this.inputData.fire_primary ??= false;

        const xr = this.context.xr;
        // VR
        if (xr && xr.controllers.length > 0) {
            this.inputData.fire_leftVR = xr.leftController?.getButton("primary")?.isDown ?? false;
            this.inputData.fire_rightVR = xr.rightController?.getButton("primary")?.isDown ?? false;
        }
        // Desktop
        else {
            if (this.input.getPointerClicked(0) && this.input.getIsMouse(0)) {
                this.inputData.fire_primary = true;
            }
        }
    }
}