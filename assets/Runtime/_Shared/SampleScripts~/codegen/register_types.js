import { TypeStore } from "@needle-tools/engine/engine/engine_typestore"

// Import types
import { RandomColor } from "../ChangeColor.ts";
import { ChangeColorOnCollision } from "../ChangeColorOnCollision.ts";
import { LookAtCamera } from "../LookAtCamera.ts";
import { PhysicsCollision } from "../PhysicsCollision.ts";
import { StartPosition } from "../StartPosition.ts";

// Register types
TypeStore.add("RandomColor", RandomColor);
TypeStore.add("ChangeColorOnCollision", ChangeColorOnCollision);
TypeStore.add("LookAtCamera", LookAtCamera);
TypeStore.add("PhysicsCollision", PhysicsCollision);
TypeStore.add("StartPosition", StartPosition);
