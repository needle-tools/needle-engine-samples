import { TypeStore } from "@needle-tools/engine"

// Import types
import { CustomUSDSettings } from "../CustomUSDSettings.js";
import { FadeOnProximity } from "../FadeOnProximity.js";

// Register types
TypeStore.add("CustomUSDSettings", CustomUSDSettings);
TypeStore.add("FadeOnProximity", FadeOnProximity);
