import { TypeStore } from "@needle-tools/engine/engine/engine_typestore"

// Import types
import { Cannon } from "../Cannon.ts";
import { RandomColor } from "../ChangeColor.ts";
import { ChangeColorOnCollision } from "../ChangeColorOnCollision.ts";
import { EmitParticlesOnClick } from "../EmitParticlesOnClick.ts";
import { HTMLButtonClick } from "../HTMLButtonEvent.ts";
import { IFrameContent } from "../IFrameContent.ts";
import { LookAtCamera } from "../LookAtCamera.ts";
import { PhysicsCollision } from "../PhysicsCollision.ts";
import { PhysicsTrigger } from "../PhysicsCollision.ts";
import { PlayAnimationOnCollision } from "../PlayAnimationOnCollision.ts";
import { PlayAnimationOnTrigger } from "../PlayAnimationOnTrigger.ts";
import { PlayAudioOnCollision } from "../PlayAudioOnCollision.ts";
import { SceneSwitcherSample } from "../SceneSwitcher.ts";
import { StartPosition } from "../StartPosition.ts";
import { AutoReset } from "../StartPosition.ts";
import { TimedSpawn } from "../TimedSpawn.ts";
import { ResetPositionOnInterval } from "../VisibilitySamples.ts";
import { ToggleVisibility } from "../VisibilitySamples.ts";

// Register types
TypeStore.add("Cannon", Cannon);
TypeStore.add("RandomColor", RandomColor);
TypeStore.add("ChangeColorOnCollision", ChangeColorOnCollision);
TypeStore.add("EmitParticlesOnClick", EmitParticlesOnClick);
TypeStore.add("HTMLButtonClick", HTMLButtonClick);
TypeStore.add("IFrameContent", IFrameContent);
TypeStore.add("LookAtCamera", LookAtCamera);
TypeStore.add("PhysicsCollision", PhysicsCollision);
TypeStore.add("PhysicsTrigger", PhysicsTrigger);
TypeStore.add("PlayAnimationOnCollision", PlayAnimationOnCollision);
TypeStore.add("PlayAnimationOnTrigger", PlayAnimationOnTrigger);
TypeStore.add("PlayAudioOnCollision", PlayAudioOnCollision);
TypeStore.add("SceneSwitcherSample", SceneSwitcherSample);
TypeStore.add("StartPosition", StartPosition);
TypeStore.add("AutoReset", AutoReset);
TypeStore.add("TimedSpawn", TimedSpawn);
TypeStore.add("ResetPositionOnInterval", ResetPositionOnInterval);
TypeStore.add("ToggleVisibility", ToggleVisibility);
