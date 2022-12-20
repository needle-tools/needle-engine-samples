import { TypeStore } from "@needle-tools/engine/engine/engine_typestore"

// Import types
import { MouseRotation } from "../MouseRotation.ts";
import { ScrollTimeline } from "../ScrollTimeline.ts";

// Register types
TypeStore.add("MouseRotation", MouseRotation);
TypeStore.add("ScrollTimeline", ScrollTimeline);
