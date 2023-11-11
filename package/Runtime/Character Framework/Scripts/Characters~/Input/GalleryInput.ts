import { serializable } from "@needle-tools/engine";

import { CharacterModule, CharacterModuleType } from "../Framework/CharacterModule";
import { Character } from "../Framework/Character";
import { Vector2 } from "three";

export class GalleryInput_Scheme {
    lookDeltaX?: number;
    lookDeltaY?: number;
    pointerPositionRC?: Vector2;
    hasClicked?: boolean;
}

export class GalleryInput extends CharacterModule {
    @serializable()
    dragOrLockPointerId: number = 0;

    get Type() { return CharacterModuleType.input; }

    moduleEarlyUpdate(): void {
        const input = this.context.input
        const state = this.frameState as GalleryInput_Scheme;

        /* if(input.getIsMouse(this.dragOrLockPointerId)) { */
            // look
            state.lookDeltaX ??= 0;
            state.lookDeltaY ??= 0;
            if (input.getPointerPressed(this.dragOrLockPointerId)) {
                const mouseDelta = input.getPointerPositionDelta(this.dragOrLockPointerId)!;
                state.lookDeltaX += mouseDelta.x / this.context.domWidth;
                state.lookDeltaY -= mouseDelta.y / this.context.domHeight; // y is inverted
            }

            // pointer position raycast space
            state.pointerPositionRC ??= new Vector2();
            state.pointerPositionRC.copy(input.getPointerPositionRC(this.dragOrLockPointerId)!);            

            // click
            state.hasClicked ??= false;
            state.hasClicked = input.getPointerClicked(this.dragOrLockPointerId);
        /* } */
    }
}
