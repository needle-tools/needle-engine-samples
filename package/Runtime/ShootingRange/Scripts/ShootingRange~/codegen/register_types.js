import { TypeStore } from "@needle-tools/engine"

// Import types
import { Gun } from "../Gun";
import { ScoreManager } from "../ScoreManager";
import { Target } from "../Target";
import { TargetHitPointRenderer } from "../TargetHitPoints";

// Register types
TypeStore.add("Gun", Gun);
TypeStore.add("ScoreManager", ScoreManager);
TypeStore.add("Target", Target);
TypeStore.add("TargetHitPointRenderer", TargetHitPointRenderer);
