/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { MapLocator } from "../MapLocator.js";
import { DisplayMap } from "../MapView.js";
import { VideoBackground } from "../VideoBackground.js";

// Register types
TypeStore.add("MapLocator", MapLocator);
TypeStore.add("DisplayMap", DisplayMap);
TypeStore.add("VideoBackground", VideoBackground);
