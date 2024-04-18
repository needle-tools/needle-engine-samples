/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { CarPlayer } from "../CarPlayer.js";
import { CarKeyControls } from "../Input/CarKeyControls.js";
import { CarKeyControls as CarKeyControls_1 } from "../Input/CarTouchControls.js";
import { CarPhysics } from "../Physics/CarPhysics.js";
import { CarWheel } from "../Physics/CarWheel.js";

// Register types
TypeStore.add("CarPlayer", CarPlayer);
TypeStore.add("CarKeyControls", CarKeyControls);
TypeStore.add("CarKeyControls", CarKeyControls_1);
TypeStore.add("CarPhysics", CarPhysics);
TypeStore.add("CarWheel", CarWheel);
