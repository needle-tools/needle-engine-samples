import { TypeStore } from "@needle-tools/engine"

// Import types
import { PresencePlatformUI } from "../PresencePlatformUI";
import { RandomColor } from "../RandomColor";
import { RevealWorldBehind } from "../RevealWorldBehind";
import { WebXRPlaneTracking } from "../WebXRPlaneTracking";

// Register types
TypeStore.add("PresencePlatformUI", PresencePlatformUI);
TypeStore.add("RandomColor", RandomColor);
TypeStore.add("RevealWorldBehind", RevealWorldBehind);
TypeStore.add("WebXRPlaneTracking", WebXRPlaneTracking);
