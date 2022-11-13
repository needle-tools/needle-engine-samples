import { TypeStore } from "@needle-tools/engine/engine/engine_typestore"

// Import types
import { LookingGlass } from "../LookingGlass.ts";
import { SingleFileDrop } from "../SingleFileDrop.ts";

// Register types
TypeStore.add("LookingGlass", LookingGlass);
TypeStore.add("SingleFileDrop", SingleFileDrop);
