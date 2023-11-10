import { GameObject, PointerType, isMobileDevice, serializable, showBalloonMessage } from "@needle-tools/engine";

import { Object3D, Vector2 } from "three";

import { CharacterModule, CharacterModuleType } from "../Framework/CharacterModule";
import { Character } from "../Framework/Character";
import { Joystick } from "./Joystick";

/** Gather inputs for movement, look, jump, sprint and zoom */
export class MobileCharacterInput extends CharacterModule {
    @serializable()
    mobileOnly: boolean = true;

    @serializable()
    sprintJoystickThreshold: number = 0.7;

    @serializable()
    pinchSensitvity: number = 1.5;

    // can't be serialized due to multiplayer
    private _moveJoystick?: Joystick;
    //@nonSerialized
    get moveJoystick(): Joystick | undefined { return this._moveJoystick; }

    get Type() { return CharacterModuleType.input; }

    private _moveJoyDelta = new Vector2();
    initialize(character: Character): void {
        super.initialize(character);

        if (!this._moveJoystick) {
            const joystickObj = new Object3D();
            joystickObj.name = "MobileJoystick - move";

            this._moveJoystick = GameObject.addNewComponent(joystickObj, Joystick, true)!;

            this.gameObject.add(joystickObj);
        }

        if (this._moveJoystick) {
            this._moveJoystick.onValueChange.addEventListener((delta, _) => {
                this._moveJoyDelta.copy(delta);
                this._moveJoyDelta.multiplyScalar(1 / this.sprintJoystickThreshold);
            });

            this._moveJoystick.enabled = (!this.mobileOnly || isMobileDevice()) && this.character.isLocalPlayer;

        }
    }

    private lastPinchMagnitude = -1;
    private isPinching = false;
    moduleEarlyUpdate(): void {
        const state = this.frameState;
        const input = this.context.input;

        // move
        state.sprint ??= false;
        state.sprint ||= this._moveJoyDelta.length() > 0.9;

        state.moveDeltaX ??= 0;
        state.moveDeltaY ??= 0;
        this._moveJoyDelta.normalize();
        state.moveDeltaX += this._moveJoyDelta.x;
        state.moveDeltaY += this._moveJoyDelta.y;


        // look
        state.lookDeltaX ??= 0;
        state.lookDeltaY ??= 0;

        // get touch delta
        if (input.getTouchesPressedCount() == 1 && !this.isPinching) {
            for (const i of this.context.input.foreachPointerId(PointerType.Touch)) {
                const delta = input.getPointerPositionDelta(i)!;
                state.lookDeltaX += delta.x / this.context.domWidth;
                state.lookDeltaY -= delta.y / this.context.domHeight; // y is inverted
            }
        }

        // scroll
        state.scrollDeltaY ??= 0;
        if (input.getTouchesPressedCount() == 2) {
            this.isPinching = true;
            const p1 = input.getPointerPosition(0)!;
            const p2 = input.getPointerPosition(1)!;

            const magnitude = p1.distanceTo(p2);
            if (this.lastPinchMagnitude == -1) {
                this.lastPinchMagnitude = magnitude;
            }
            const delta = (this.lastPinchMagnitude - magnitude) * this.pinchSensitvity;
            state.scrollDeltaY += delta;

            this.lastPinchMagnitude = magnitude;

            // disable look if zooming
            if (delta != 0) {
                state.lookDeltaX = 0;
                state.lookDeltaY = 0;
            }
        }
        else {
            this.lastPinchMagnitude = -1;
        }

        // reset pinching 
        if (input.getTouchesPressedCount() == 0)
            this.isPinching = false;

        // jump        
        state.jump ??= false;
        for (const i of this.context.input.foreachPointerId(PointerType.Touch)) {
            state.jump ||= input.getPointerDoubleClicked(i);
        }
    }
}
