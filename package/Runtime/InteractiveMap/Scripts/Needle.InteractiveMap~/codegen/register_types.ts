/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { MapLocator } from "../MapLocator.js";
import { DisplayMap } from "../MapView.js";

// Register types
TypeStore.add("MapLocator", MapLocator);
TypeStore.add("DisplayMap", DisplayMap);
