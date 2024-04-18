import { MobileCharacterInput,serializable } from "@needle-tools/engine";
import { Vector2 } from "three";
import { ShootingRangeCharacterInput_Scheme } from "./ShootingRangeCharacterInput_Scheme";

export class MobileShootingRangeControls extends MobileCharacterInput {

    @serializable()
    tapPixelTrashold: number = 25;

    protected override get inputData(): ShootingRangeCharacterInput_Scheme {
        return this.frameData as ShootingRangeCharacterInput_Scheme;
    }

    protected firePointerPos: Vector2 | null = null;
    protected override lookInput(): void {
        super.lookInput();

        this.inputData.fire_hover_primary ??= false;
        this.inputData.fire_primary ??= false;


        if (this.input.getIsTouch(0) && this.input.getTouchesPressedCount() == 1 && this.input.getPointerDown(0)) {
            this.firePointerPos = this.input.getPointerPosition(0)!.clone();
        }

        if (this.input.getIsTouch(0) && this.input.getTouchesPressedCount() == 0 && this.input.getPointerUp(0) && this.firePointerPos != null) {
            const currPos = this.input.getPointerPosition(0)!;
            if (this.firePointerPos.sub(currPos).length() > this.tapPixelTrashold) {
                this.inputData.fire_hover_primary = true;
            }
            else {
                this.inputData.fire_primary = true;
            }

            this.firePointerPos = null;
        }
    }
}