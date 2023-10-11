import { TypeStore } from "@needle-tools/engine"

// Import types
import { NetworkedQuads } from "../NetworkedQuads.js";
import { PresencePlatformUI } from "../PresencePlatformUI.js";
import { RandomPlaneColor } from "../RandomPlaneColor.js";
import { RevealWorldBehind } from "../RevealWorldBehind.js";

// Register types
TypeStore.add("NetworkedQuads", NetworkedQuads);
TypeStore.add("PresencePlatformUI", PresencePlatformUI);
TypeStore.add("RandomPlaneColor", RandomPlaneColor);
TypeStore.add("RevealWorldBehind", RevealWorldBehind);
