import { TypeStore } from "@needle-tools/engine"

// Import types
import { GalleryCharacter } from "../GalleryCharacter.js";
import { StandardCharacter } from "../StandardCharacter.js";
import { CharacterCamera } from "../Camera/CharacterCamera.js";
import { PersonCamera } from "../Camera/PersonCamera.js";
import { CharacterPhysics_Scheme } from "../Framework/CharacterState.js";
import { CommonCharacterInput_Scheme } from "../Framework/CharacterState.js";
import { DesktopCharacterInput } from "../Input/DesktopCharacterInput.js";
import { GalleryInput_Scheme } from "../Input/GalleryInput.js";
import { GalleryInput } from "../Input/GalleryInput.js";
import { Joystick } from "../Input/Joystick.js";
import { MobileCharacterInput } from "../Input/MobileCharacterInput.js";
import { PointerLock } from "../Input/PointerLock.js";
import { CommonAvatar } from "../Misc/CommonAvatar.js";
import { CommonCharacterAnimations } from "../Misc/CommonCharacterAnimations.js";
import { CommonCharacterAudio } from "../Misc/CommonCharacterAudio.js";
import { CharacterPhysics } from "../Physics/CharacterPhysics.js";
import { GalleryPhysics } from "../Physics/GalleryPhysics.js";
import { JumpPad } from "../Physics/JumpPad.js";
import { Lift } from "../Physics/Lift.js";

// Register types
TypeStore.add("GalleryCharacter", GalleryCharacter);
TypeStore.add("StandardCharacter", StandardCharacter);
TypeStore.add("CharacterCamera", CharacterCamera);
TypeStore.add("PersonCamera", PersonCamera);
TypeStore.add("CharacterPhysics_Scheme", CharacterPhysics_Scheme);
TypeStore.add("CommonCharacterInput_Scheme", CommonCharacterInput_Scheme);
TypeStore.add("DesktopCharacterInput", DesktopCharacterInput);
TypeStore.add("GalleryInput_Scheme", GalleryInput_Scheme);
TypeStore.add("GalleryInput", GalleryInput);
TypeStore.add("Joystick", Joystick);
TypeStore.add("MobileCharacterInput", MobileCharacterInput);
TypeStore.add("PointerLock", PointerLock);
TypeStore.add("CommonAvatar", CommonAvatar);
TypeStore.add("CommonCharacterAnimations", CommonCharacterAnimations);
TypeStore.add("CommonCharacterAudio", CommonCharacterAudio);
TypeStore.add("CharacterPhysics", CharacterPhysics);
TypeStore.add("GalleryPhysics", GalleryPhysics);
TypeStore.add("JumpPad", JumpPad);
TypeStore.add("Lift", Lift);
