import { TypeStore } from "@needle-tools/engine"

// Import types
import { Cannon } from "../Cannon";
import { RandomColor } from "../ChangeColor";
import { ChangeColorOnCollision } from "../ChangeColorOnCollision";
import { EmitParticlesOnClick } from "../EmitParticlesOnClick";
import { HTMLButtonClick } from "../HTMLButtonEvent";
import { IFrameContent } from "../IFrameContent";
import { LookAtCamera } from "../LookAtCamera";
import { PhysicsCollision } from "../PhysicsCollision";
import { PhysicsTrigger } from "../PhysicsCollision";
import { PlayAnimationOnCollision } from "../PlayAnimationOnCollision";
import { PlayAnimationOnTrigger } from "../PlayAnimationOnTrigger";
import { PlayAudioOnCollision } from "../PlayAudioOnCollision";
import { SceneSwitcherSample } from "../SceneSwitcher";
import { StartPosition } from "../StartPosition";
import { AutoReset } from "../StartPosition";
import { TimedSpawn } from "../TimedSpawn";
import { ResetPositionOnInterval } from "../VisibilitySamples";
import { ToggleVisibility } from "../VisibilitySamples";

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
