import { TypeStore } from "@needle-tools/engine"

// Import types
import { FirstPersonController } from "../FirstPersonCharacter.js";
import { PointerLock } from "../LockPointer.js";
import { MobileControls } from "../MobileControls.js";
import { SpawnHandler } from "../Networking/SpawnHandler.js";
import { Joystick } from "../UI Components/Joystick.js";
import { Touchpad } from "../UI Components/Touchpad.js";

// Register types
TypeStore.add("FirstPersonController", FirstPersonController);
TypeStore.add("PointerLock", PointerLock);
TypeStore.add("MobileControls", MobileControls);
TypeStore.add("SpawnHandler", SpawnHandler);
TypeStore.add("Joystick", Joystick);
TypeStore.add("Touchpad", Touchpad);
