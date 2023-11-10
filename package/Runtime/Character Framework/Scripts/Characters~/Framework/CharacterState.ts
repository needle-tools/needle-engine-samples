import { Vector3 } from "three";

export class CharacterPhysicsState {
    characterIsGrounded?: boolean;
    characterIsJumping?: boolean;
    characterDirection?: Vector3;
    characterSpeed?: number;
    characterVelocity?: Vector3;
    /** True if the character is receiving input */
    isMoving?: boolean;
    /** The last time the character received input */
    lastMovingTime?: number;
}


export class CommonCharacterInputState {
    moveDeltaX?: number;
    moveDeltaY?: number;
    lookDeltaX?: number;
    lookDeltaY?: number;
    scrollDeltaY?: number;
    jump?: boolean;
    sprint?: boolean;
    isCursorLocked?: boolean;

    static anyInput(state: CommonCharacterInputState): boolean {
        return (state.moveDeltaX ?? 0) != 0 ||
            (state.moveDeltaY ?? 0) != 0 ||
            (state.lookDeltaX ?? 0) != 0 ||
            (state.lookDeltaY ?? 0) != 0 ||
            (state.scrollDeltaY ?? 0) != 0 ||
            (state.jump ?? false) ||
            (state.sprint ?? false);
    }
}

/**
 * Blackboard for modules to transfer data and expose API
 */
export type CharacterState = CharacterPhysicsState & CommonCharacterInputState;
