import { TypeStore } from "@needle-tools/engine"

// Import types
import { RaceCarManager } from "../RaceCarManager.js";
import { RaceCarMovement } from "../RaceCarManager.js";

// Register types
TypeStore.add("RaceCarManager", RaceCarManager);
TypeStore.add("RaceCarMovement", RaceCarMovement);
