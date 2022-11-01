import { TypeStore } from "@needle-tools/engine/engine/engine_typestore"

// Import types
import { Cannon } from "../Cannon.ts";
import { RandomColor } from "../ChangeColor.ts";
import { ChangeColorOnCollision } from "../ChangeColorOnCollision.ts";
import { LookAtCamera } from "../LookAtCamera.ts";
import { PhysicsCollision } from "../PhysicsCollision.ts";
import { PhysicsTrigger } from "../PhysicsCollision.ts";
import { PlayAnimationOnCollision } from "../PlayAnimationOnCollision.ts";
import { PlayAnimationOnTrigger } from "../PlayAnimationOnTrigger.ts";
import { PlayAudioOnCollision } from "../PlayAudioOnCollision.ts";
import { StartPosition } from "../StartPosition.ts";
import { AutoReset } from "../StartPosition.ts";
import { TimedSpawn } from "../TimedSpawn.ts";

// Register types
TypeStore.add("Cannon", Cannon);
TypeStore.add("RandomColor", RandomColor);
TypeStore.add("ChangeColorOnCollision", ChangeColorOnCollision);
TypeStore.add("LookAtCamera", LookAtCamera);
TypeStore.add("PhysicsCollision", PhysicsCollision);
TypeStore.add("PhysicsTrigger", PhysicsTrigger);
TypeStore.add("PlayAnimationOnCollision", PlayAnimationOnCollision);
TypeStore.add("PlayAnimationOnTrigger", PlayAnimationOnTrigger);
TypeStore.add("PlayAudioOnCollision", PlayAudioOnCollision);
TypeStore.add("StartPosition", StartPosition);
TypeStore.add("AutoReset", AutoReset);
TypeStore.add("TimedSpawn", TimedSpawn);
