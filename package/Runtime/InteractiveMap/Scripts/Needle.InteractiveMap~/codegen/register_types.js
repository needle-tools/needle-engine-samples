import { TypeStore } from "@needle-tools/engine"

// Import types
import { MapLocator } from "../MapLocator";
import { DisplayMap } from "../MapView";

// Register types
TypeStore.add("MapLocator", MapLocator);
TypeStore.add("DisplayMap", DisplayMap);
