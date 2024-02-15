/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { GyroscopeControls } from "../GyroscopeControls.js";
import { DeviceMotion } from "../GyroscopeControls.js";
import { OrientationSensor } from "../GyroscopeControls.js";
import { SensorAccessSample } from "../SensorAccessSample.js";

// Register types
TypeStore.add("GyroscopeControls", GyroscopeControls);
TypeStore.add("DeviceMotion", DeviceMotion);
TypeStore.add("OrientationSensor", OrientationSensor);
TypeStore.add("SensorAccessSample", SensorAccessSample);
