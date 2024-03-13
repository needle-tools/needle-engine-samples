/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { MouseRotation } from "../MouseRotation.js";
import { ScrollTimeline } from "../ScrollTimeline.js";
import { ScrollTimelineSlider } from "../ScrollTimelineSlider.js";
import { ScrollTimeline_2 } from "../ScrollTimeline_2.js";

// Register types
TypeStore.add("MouseRotation", MouseRotation);
TypeStore.add("ScrollTimeline", ScrollTimeline);
TypeStore.add("ScrollTimelineSlider", ScrollTimelineSlider);
TypeStore.add("ScrollTimeline_2", ScrollTimeline_2);
