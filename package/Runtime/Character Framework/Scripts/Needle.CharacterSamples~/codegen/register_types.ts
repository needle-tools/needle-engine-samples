import { TypeStore } from "@needle-tools/engine"

// Import types
import { JumpPad } from "../JumpPad.js";
import { Lift } from "../Lift.js";

// Register types
TypeStore.add("JumpPad", JumpPad);
TypeStore.add("Lift", Lift);
