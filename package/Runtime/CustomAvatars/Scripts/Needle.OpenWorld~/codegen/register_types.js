import { TypeStore } from "@needle-tools/engine"

// Import types
import { CharacterManager } from "../CharacterManager";
import { CharacterSwitcher } from "../CharacterSwitcher";
import { LocalPlayerControls } from "../LocalPlayerControls";
import { SoftShadows } from "../SoftShadows";
import { SyncedAnimator } from "../SyncedAnimator";

// Register types
TypeStore.add("CharacterManager", CharacterManager);
TypeStore.add("CharacterSwitcher", CharacterSwitcher);
TypeStore.add("LocalPlayerControls", LocalPlayerControls);
TypeStore.add("SoftShadows", SoftShadows);
TypeStore.add("SyncedAnimator", SyncedAnimator);
