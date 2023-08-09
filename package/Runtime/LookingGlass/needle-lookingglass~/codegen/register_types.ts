import { TypeStore } from "@needle-tools/engine"

// Import types
import { LookingGlass } from "../LookingGlass.js";
import { SingleFileDrop } from "../SingleFileDrop.js";

// Register types
TypeStore.add("LookingGlass", LookingGlass);
TypeStore.add("SingleFileDrop", SingleFileDrop);
