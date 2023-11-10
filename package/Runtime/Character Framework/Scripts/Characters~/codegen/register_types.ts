import { TypeStore } from "@needle-tools/engine"

// Import types
import { StandardCharacter } from "../StandardCharacter.js";
import { CharacterCamera } from "../Camera/CharacterCamera.js";
import { PersonCamera } from "../Camera/PersonCamera.js";
import { CharacterPhysicsState } from "../Framework/CharacterState.js";
import { CommonCharacterInputState } from "../Framework/CharacterState.js";
import { DesktopCharacterInput } from "../Input/DesktopCharacterInput.js";
import { Joystick } from "../Input/Joystick.js";
import { MobileCharacterInput } from "../Input/MobileCharacterInput.js";
import { PointerLock } from "../Input/PointerLock.js";
import { CommonAvatar } from "../Misc/CommonAvatar.js";
import { CommonCharacterAnimations } from "../Misc/CommonCharacterAnimations.js";
import { CommonCharacterAudio } from "../Misc/CommonCharacterAudio.js";
import { CharacterPhysics } from "../Physics/CharacterPhysics.js";
import { JumpPad } from "../Physics/JumpPad.js";
import { Lift } from "../Physics/Lift.js";

// Register types
TypeStore.add("StandardCharacter", StandardCharacter);
TypeStore.add("CharacterCamera", CharacterCamera);
TypeStore.add("PersonCamera", PersonCamera);
TypeStore.add("CharacterPhysicsState", CharacterPhysicsState);
TypeStore.add("CommonCharacterInputState", CommonCharacterInputState);
TypeStore.add("DesktopCharacterInput", DesktopCharacterInput);
TypeStore.add("Joystick", Joystick);
TypeStore.add("MobileCharacterInput", MobileCharacterInput);
TypeStore.add("PointerLock", PointerLock);
TypeStore.add("CommonAvatar", CommonAvatar);
TypeStore.add("CommonCharacterAnimations", CommonCharacterAnimations);
TypeStore.add("CommonCharacterAudio", CommonCharacterAudio);
TypeStore.add("CharacterPhysics", CharacterPhysics);
TypeStore.add("JumpPad", JumpPad);
TypeStore.add("Lift", Lift);
