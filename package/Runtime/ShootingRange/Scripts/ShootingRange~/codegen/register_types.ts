import { TypeStore } from "@needle-tools/engine"

// Import types
import { Gun } from "../Gun.js";
import { ScoreManager } from "../ScoreManager.js";
import { Target } from "../Target.js";
import { TargetHitPointRenderer } from "../TargetHitPoints.js";

// Register types
TypeStore.add("Gun", Gun);
TypeStore.add("ScoreManager", ScoreManager);
TypeStore.add("Target", Target);
TypeStore.add("TargetHitPointRenderer", TargetHitPointRenderer);
