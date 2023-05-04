import { TypeStore } from "@needle-tools/engine"

// Import types
import { NetworkedQuads } from "../NetworkedQuads";
import { PresencePlatformUI } from "../PresencePlatformUI";
import { RandomColor } from "../RandomColor";
import { RevealWorldBehind } from "../RevealWorldBehind";

// Register types
TypeStore.add("NetworkedQuads", NetworkedQuads);
TypeStore.add("PresencePlatformUI", PresencePlatformUI);
TypeStore.add("RandomColor", RandomColor);
TypeStore.add("RevealWorldBehind", RevealWorldBehind);
