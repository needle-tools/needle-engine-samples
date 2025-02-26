/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { CarController } from "../CarController.js";
import { CarDropHelper } from "../CarDropHelper.js";
import { CarPhysics } from "../CarPhysics.js";
import { CarRadio } from "../CarRadio.js";
import { CarSelection } from "../CarSelection.js";
import { CarTouchControls } from "../CarTouchControls.js";
import { CarWheel } from "../CarWheel.js";
import { SkidTrailBehaviour } from "../CarWheel.js";
import { CarUIButton } from "../UI/CarUIButton.js";

// Register types
TypeStore.add("CarController", CarController);
TypeStore.add("CarDropHelper", CarDropHelper);
TypeStore.add("CarPhysics", CarPhysics);
TypeStore.add("CarRadio", CarRadio);
TypeStore.add("CarSelection", CarSelection);
TypeStore.add("CarTouchControls", CarTouchControls);
TypeStore.add("CarWheel", CarWheel);
TypeStore.add("SkidTrailBehaviour", SkidTrailBehaviour);
TypeStore.add("CarUIButton", CarUIButton);
