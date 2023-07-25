import { TypeStore } from "@needle-tools/engine"

// Import types
import { FirstPersonController } from "../FirstPersonCharacter";
import { PointerLock } from "../LockPointer";
import { SpawnHandler } from "../Networking/SpawnHandler";
import { Joystick } from "../UI Components/Joystick";
import { Touchpad } from "../UI Components/Touchpad";

// Register types
TypeStore.add("FirstPersonController", FirstPersonController);
TypeStore.add("PointerLock", PointerLock);
TypeStore.add("SpawnHandler", SpawnHandler);
TypeStore.add("Joystick", Joystick);
TypeStore.add("Touchpad", Touchpad);
