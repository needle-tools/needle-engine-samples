import { TypeStore } from "@needle-tools/engine"

// Import types
import { PresencePlatformUI } from "../PresencePlatformUI";
import { RandomColor } from "../RandomColor";
import { WebXRPlaneTracking } from "../WebXRPlaneTracking";

// Register types
TypeStore.add("PresencePlatformUI", PresencePlatformUI);
TypeStore.add("RandomColor", RandomColor);
TypeStore.add("WebXRPlaneTracking", WebXRPlaneTracking);
