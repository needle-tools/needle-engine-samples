import { TypeStore } from "@needle-tools/engine"

// Import types
import { LinesDrawer } from "../LineDrawer.js";
import { LineInstanceHandler } from "../LinesManager.js";
import { LinesManager } from "../LinesManager.js";

// Register types
TypeStore.add("LinesDrawer", LinesDrawer);
TypeStore.add("LineInstanceHandler", LineInstanceHandler);
TypeStore.add("LinesManager", LinesManager);
