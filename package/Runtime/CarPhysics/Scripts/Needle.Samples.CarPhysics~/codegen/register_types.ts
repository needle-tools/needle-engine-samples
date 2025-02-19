/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { CarController } from "../CarController.js";
import { CarWheel } from "../CarPhysics.js";
import { SkidTrailBehaviour } from "../CarPhysics.js";
import { CarPhysics } from "../CarPhysics.js";
import { CarRadio } from "../CarRadio.js";
import { CarTouchControls } from "../CarTouchControls.js";
import { CarUIButton } from "../UI/CarUIButton.js";

// Register types
TypeStore.add("CarController", CarController);
TypeStore.add("CarWheel", CarWheel);
TypeStore.add("SkidTrailBehaviour", SkidTrailBehaviour);
TypeStore.add("CarPhysics", CarPhysics);
TypeStore.add("CarRadio", CarRadio);
TypeStore.add("CarTouchControls", CarTouchControls);
TypeStore.add("CarUIButton", CarUIButton);
