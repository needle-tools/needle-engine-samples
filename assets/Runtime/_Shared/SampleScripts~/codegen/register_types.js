import { TypeStore } from "@needle-tools/engine/engine/engine_typestore"

// Import types
import { RandomColor } from "../ChangeColor.ts";
import { LookAtCamera } from "../LookAtCamera.ts";

// Register types
TypeStore.add("RandomColor", RandomColor);
TypeStore.add("LookAtCamera", LookAtCamera);
