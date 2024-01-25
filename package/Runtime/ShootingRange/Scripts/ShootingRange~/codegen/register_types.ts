import { TypeStore } from "@needle-tools/engine"

// Import types
import { ExtendedXRcontrollerMovement } from "../ExtendedXRcontrollerMovement.js";
import { Gun } from "../Gun.js";
import { ScoreManager } from "../ScoreManager.js";
import { ShootingRangeMobileControls } from "../ShootingRangeMobileControls.js";
import { Target } from "../Target.js";
import { TargetHitPointRenderer } from "../TargetHitPoints.js";

// Register types
TypeStore.add("ExtendedXRcontrollerMovement", ExtendedXRcontrollerMovement);
TypeStore.add("Gun", Gun);
TypeStore.add("ScoreManager", ScoreManager);
TypeStore.add("ShootingRangeMobileControls", ShootingRangeMobileControls);
TypeStore.add("Target", Target);
TypeStore.add("TargetHitPointRenderer", TargetHitPointRenderer);
