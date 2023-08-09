import { TypeStore } from "@needle-tools/engine"

// Import types
import { CameraSpot } from "../CameraSpot.js";
import { StateManager } from "../StateManager.js";

// Register types
TypeStore.add("CameraSpot", CameraSpot);
TypeStore.add("StateManager", StateManager);
