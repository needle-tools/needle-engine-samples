import { serializable } from "@needle-tools/engine";

import { CharacterModule, CharacterModuleType } from "../Framework/CharacterModule";
import { Character } from "../Framework/Character";
import { PointerLock } from "./PointerLock";


/** Gather inputs for movement, look, jump, sprint and zoom */
export class DesktopCharacterInput extends CharacterModule {

    @serializable()
    lockCursor: boolean = true;

    @serializable()
    rawMouseWhileLocked: boolean = true;

    @serializable()
    moveLeftKeys: string[] = ["a", "ArrowLeft"];

    @serializable()
    moveRightKeys: string[] = ["d", "ArrowRight"];

    @serializable()
    moveForwardKeys: string[] = ["w", "ArrowUp"];

    @serializable()
    moveBackwardKeys: string[] = ["s", "ArrowDown"];

    @serializable()
    jumpKeys: string[] = ["Space"];

    @serializable()
    sprintKeys: string[] = ["Shift"];

    @serializable()
    dragOrLockPointerId: number = 0;

    private pointerLock?: PointerLock;

    get Type() { return CharacterModuleType.input; }

    initialize(character: Character): void {
        super.initialize(character);

        this.pointerLock = new PointerLock(this.context.domElement, this.rawMouseWhileLocked);
    }

    onDestroy(): void {
        this.pointerLock?.dispose();
    }

    moduleEarlyUpdate(): void {
        const input = this.context.input
        const state = this.frameState;

        // jump & sprint
        state.jump ||= this.areKeysPressed(this.jumpKeys);
        state.sprint ||= this.areKeysPressed(this.sprintKeys);

        // attempt to lock
        const lockInput = input.getPointerPressed(this.dragOrLockPointerId) && input.getIsMouse(this.dragOrLockPointerId);
        if (this.lockCursor && !PointerLock.IsLocked && lockInput) {
            this.pointerLock?.lock();
        }
        state.isCursorLocked = PointerLock.IsLocked;

        // look
        state.lookDeltaX ??= 0;
        state.lookDeltaY ??= 0;

        if (input.getIsMouse(this.dragOrLockPointerId) && (PointerLock.IsLocked || input.getPointerPressed(this.dragOrLockPointerId))) {
            const mouseDelta = input.getPointerPositionDelta(this.dragOrLockPointerId)!;
            state.lookDeltaX += mouseDelta.x / this.context.domWidth;
            state.lookDeltaY -= mouseDelta.y / this.context.domHeight; // y is inverted
        }

        // scroll
        state.scrollDeltaY ??= 0;
        state.scrollDeltaY += input.getMouseWheelDeltaY(0);

        // move
        state.moveDeltaX ??= 0;
        state.moveDeltaY ??= 0;

        // not using else if to allow user to negate the movement which is more intuitive
        // then choosing one input as more dominant.
        if (this.areKeysPressed(this.moveBackwardKeys))
            state.moveDeltaY -= 1;
        if (this.areKeysPressed(this.moveForwardKeys))
            state.moveDeltaY += 1;
        if (this.areKeysPressed(this.moveRightKeys))
            state.moveDeltaX += 1;
        if (this.areKeysPressed(this.moveLeftKeys))
            state.moveDeltaX -= 1;
    }

    private areKeysPressed(keys: string[]): boolean {
        for (const i in keys) {
            const key = keys[i];
            if (this.context.input.isKeyPressed(key)) {
                return true;
            }
        }

        return false;
    }
}
