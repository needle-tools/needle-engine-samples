/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { CarPlayer } from "../CarPlayer.js";
import { CarKeyControls } from "../Input/CarKeyControls.js";
import { CarTouchControls } from "../Input/CarTouchControls.js";
import { CarUIButton } from "../Input/CarUIButton.js";
import { CarPhysics } from "../Physics/CarPhysics.js";
import { CarWheel } from "../Physics/CarWheel.js";

// Register types
TypeStore.add("CarPlayer", CarPlayer);
TypeStore.add("CarKeyControls", CarKeyControls);
TypeStore.add("CarTouchControls", CarTouchControls);
TypeStore.add("CarUIButton", CarUIButton);
TypeStore.add("CarPhysics", CarPhysics);
TypeStore.add("CarWheel", CarWheel);
