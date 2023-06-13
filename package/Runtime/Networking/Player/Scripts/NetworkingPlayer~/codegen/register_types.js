import { TypeStore } from "@needle-tools/engine"

// Import types
import { Player } from "../Player";
import { PlayerManager } from "../PlayerManager";

// Register types
TypeStore.add("Player", Player);
TypeStore.add("PlayerManager", PlayerManager);
