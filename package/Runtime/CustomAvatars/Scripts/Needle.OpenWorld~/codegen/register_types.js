import { TypeStore } from "@needle-tools/engine"

// Import types
import { CharacterManager } from "../CharacterManager";
import { CharacterSwitcher } from "../CharacterSwitcher";
import { LocalPlayerControls } from "../LocalPlayerControls";
import { SyncedAnimator } from "../SyncedAnimator";

// Register types
TypeStore.add("CharacterManager", CharacterManager);
TypeStore.add("CharacterSwitcher", CharacterSwitcher);
TypeStore.add("LocalPlayerControls", LocalPlayerControls);
TypeStore.add("SyncedAnimator", SyncedAnimator);
