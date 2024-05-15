/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { Gyroscope } from "../Gyroscope.js";
import { DeviceMotion } from "../Gyroscope.js";
import { OrientationSensor } from "../Gyroscope.js";
import { PanoramaControls } from "../PanoramaControls.js";
import { SensorAccessSample } from "../SensorAccessSample.js";

// Register types
TypeStore.add("Gyroscope", Gyroscope);
TypeStore.add("DeviceMotion", DeviceMotion);
TypeStore.add("OrientationSensor", OrientationSensor);
TypeStore.add("PanoramaControls", PanoramaControls);
TypeStore.add("SensorAccessSample", SensorAccessSample);
