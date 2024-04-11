/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { DoubleJumpCharacter } from "../Characters/DoubleJumpCharacter.js";
import { JumpPad } from "../Misc/JumpPad.js";
import { Lift } from "../Misc/Lift.js";

// Register types
TypeStore.add("DoubleJumpCharacter", DoubleJumpCharacter);
TypeStore.add("JumpPad", JumpPad);
TypeStore.add("Lift", Lift);
