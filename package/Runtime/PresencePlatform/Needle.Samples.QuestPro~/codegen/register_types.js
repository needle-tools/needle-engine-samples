import { TypeStore } from "@needle-tools/engine"

// Import types
import { NetworkedQuads } from "../NetworkedQuads";
import { PresencePlatformUI } from "../PresencePlatformUI";
import { RandomPlaneColor } from "../RandomPlaneColor";
import { RevealWorldBehind } from "../RevealWorldBehind";

// Register types
TypeStore.add("NetworkedQuads", NetworkedQuads);
TypeStore.add("PresencePlatformUI", PresencePlatformUI);
TypeStore.add("RandomPlaneColor", RandomPlaneColor);
TypeStore.add("RevealWorldBehind", RevealWorldBehind);
