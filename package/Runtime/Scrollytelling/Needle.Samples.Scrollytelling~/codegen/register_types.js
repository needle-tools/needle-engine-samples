import { TypeStore } from "@needle-tools/engine"

// Import types
import { MouseRotation } from "../MouseRotation.ts";
import { ScrollTimeline } from "../ScrollTimeline.ts";

// Register types
TypeStore.add("MouseRotation", MouseRotation);
TypeStore.add("ScrollTimeline", ScrollTimeline);
