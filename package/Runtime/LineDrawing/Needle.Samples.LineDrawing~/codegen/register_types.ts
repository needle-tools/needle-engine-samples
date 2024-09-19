/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { LinesDrawer } from "../LineDrawer.js";
import { LineInstanceHandler } from "../LinesManager.js";
import { BrushModel } from "../LinesManager.js";
import { LinesManager } from "../LinesManager.js";
import { PenSwap } from "../PenSwap.js";

// Register types
TypeStore.add("LinesDrawer", LinesDrawer);
TypeStore.add("LineInstanceHandler", LineInstanceHandler);
TypeStore.add("BrushModel", BrushModel);
TypeStore.add("LinesManager", LinesManager);
TypeStore.add("PenSwap", PenSwap);
