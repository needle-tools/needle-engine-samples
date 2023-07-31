import { TypeStore } from "@needle-tools/engine"

// Import types
import { LightSwitch } from "../Lightmaps.js";
import { LightmapConfigurations } from "../Lightmaps.js";

// Register types
TypeStore.add("LightSwitch", LightSwitch);
TypeStore.add("LightmapConfigurations", LightmapConfigurations);
