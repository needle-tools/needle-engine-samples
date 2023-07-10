import { TypeStore } from "@needle-tools/engine"

// Import types
import { Hotspot } from "../Hotspot";
import { HotspotBehaviour } from "../Hotspot";
import { HotspotManager } from "../Hotspot";
import { UIEventRealy } from "../UIEventRelay";

// Register types
TypeStore.add("Hotspot", Hotspot);
TypeStore.add("HotspotBehaviour", HotspotBehaviour);
TypeStore.add("HotspotManager", HotspotManager);
TypeStore.add("UIEventRealy", UIEventRealy);
