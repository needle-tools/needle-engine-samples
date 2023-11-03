import { TypeStore } from "@needle-tools/engine"

// Import types
import { CustomXRController } from "../CustomXRController.js";
import { VibrateControllerExample } from "../VibrateControllerExample.js";
import { XRControllerInputDebugger } from "../XRControllerInputDebugger.js";

// Register types
TypeStore.add("CustomXRController", CustomXRController);
TypeStore.add("VibrateControllerExample", VibrateControllerExample);
TypeStore.add("XRControllerInputDebugger", XRControllerInputDebugger);
