/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { FirstPersonController } from "../FirstPersonCharacter.js";
import { PointerLock } from "../LockPointer.js";
import { MobileControls } from "../MobileControls.js";
import { SpawnHandler } from "../Networking/SpawnHandler.js";

// Register types
TypeStore.add("FirstPersonController", FirstPersonController);
TypeStore.add("PointerLock", PointerLock);
TypeStore.add("MobileControls", MobileControls);
TypeStore.add("SpawnHandler", SpawnHandler);
