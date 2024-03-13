/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { Hotspot } from "../Hotspot.js";
import { HotspotBehaviour } from "../Hotspot.js";
import { HotspotManager } from "../Hotspot.js";
import { UIEventRealy } from "../UIEventRelay.js";

// Register types
TypeStore.add("Hotspot", Hotspot);
TypeStore.add("HotspotBehaviour", HotspotBehaviour);
TypeStore.add("HotspotManager", HotspotManager);
TypeStore.add("UIEventRealy", UIEventRealy);
