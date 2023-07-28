import { TypeStore } from "@needle-tools/engine"

// Import types
import { CharacterManager } from "../CharacterManager.js";
import { CharacterSwitcher } from "../CharacterSwitcher.js";
import { LocalPlayerControls } from "../LocalPlayerControls.js";
import { SyncedAnimator } from "../SyncedAnimator.js";

// Register types
TypeStore.add("CharacterManager", CharacterManager);
TypeStore.add("CharacterSwitcher", CharacterSwitcher);
TypeStore.add("LocalPlayerControls", LocalPlayerControls);
TypeStore.add("SyncedAnimator", SyncedAnimator);
