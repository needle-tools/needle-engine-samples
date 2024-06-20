/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { CarWheel } from "../CarController.js";
import { CarController } from "../CarController.js";

// Register types
TypeStore.add("CarWheel", CarWheel);
TypeStore.add("CarController", CarController);
