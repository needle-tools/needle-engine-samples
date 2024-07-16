/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { AlignCamera } from "../AlignCamera.js";
import { MapLocator } from "../MapLocator.js";
import { DisplayMap } from "../MapView.js";
import { VideoBackground } from "../VideoBackground.js";

// Register types
TypeStore.add("AlignCamera", AlignCamera);
TypeStore.add("MapLocator", MapLocator);
TypeStore.add("DisplayMap", DisplayMap);
TypeStore.add("VideoBackground", VideoBackground);
