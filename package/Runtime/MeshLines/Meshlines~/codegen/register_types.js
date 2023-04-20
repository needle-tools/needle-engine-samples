import { TypeStore } from "@needle-tools/engine"

// Import types
import { LinesDrawer } from "../LineDrawer";
import { LineInstanceHandler } from "../LinesManager";
import { LinesManager } from "../LinesManager";

// Register types
TypeStore.add("LinesDrawer", LinesDrawer);
TypeStore.add("LineInstanceHandler", LineInstanceHandler);
TypeStore.add("LinesManager", LinesManager);
