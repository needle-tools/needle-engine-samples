import { TypeStore } from "@needle-tools/engine"

// Import types
import { Cannon } from "../Cannon";
import { RandomColor } from "../ChangeColor";
import { ChangeColorOnCollision } from "../ChangeColorOnCollision";
import { IncreaseShaderSpeedOverTime } from "../ChangeCustomShaderProperty";
import { DisableEnvironmentLight } from "../DisableEnvironment";
import { EmitParticlesOnClick } from "../EmitParticlesOnClick";
import { HTMLButtonClick } from "../HTMLButtonEvent";
import { IFrameContent } from "../IFrameContent";
import { ImageTrackingDownloadUI } from "../ImageTrackingDownloadUI";
import { LookAtCamera } from "../LookAtCamera";
import { Networking_ClickToChangeColor } from "../Networking";
import { Networking_StringArray } from "../Networking";
import { Networking_Object } from "../Networking";
import { PhysicsCollision } from "../PhysicsCollision";
import { PhysicsTrigger } from "../PhysicsCollision";
import { PlayAnimationOnCollision } from "../PlayAnimationOnCollision";
import { PlayAnimationOnTrigger } from "../PlayAnimationOnTrigger";
import { PlayAudioOnCollision } from "../PlayAudioOnCollision";
import { PrefabSceneSwitcherSample } from "../SceneSwitcher";
import { SceneSwitcherSample } from "../SceneSwitcher";
import { StartPosition } from "../StartPosition";
import { AutoReset } from "../StartPosition";
import { TimedSpawn } from "../TimedSpawn";
import { Variatns } from "../Variants";
import { VideoBackground } from "../VideoBackground";
import { ResetPositionOnInterval } from "../VisibilitySamples";
import { ToggleVisibility } from "../VisibilitySamples";

// Register types
TypeStore.add("Cannon", Cannon);
TypeStore.add("RandomColor", RandomColor);
TypeStore.add("ChangeColorOnCollision", ChangeColorOnCollision);
TypeStore.add("IncreaseShaderSpeedOverTime", IncreaseShaderSpeedOverTime);
TypeStore.add("DisableEnvironmentLight", DisableEnvironmentLight);
TypeStore.add("EmitParticlesOnClick", EmitParticlesOnClick);
TypeStore.add("HTMLButtonClick", HTMLButtonClick);
TypeStore.add("IFrameContent", IFrameContent);
TypeStore.add("ImageTrackingDownloadUI", ImageTrackingDownloadUI);
TypeStore.add("LookAtCamera", LookAtCamera);
TypeStore.add("Networking_ClickToChangeColor", Networking_ClickToChangeColor);
TypeStore.add("Networking_StringArray", Networking_StringArray);
TypeStore.add("Networking_Object", Networking_Object);
TypeStore.add("PhysicsCollision", PhysicsCollision);
TypeStore.add("PhysicsTrigger", PhysicsTrigger);
TypeStore.add("PlayAnimationOnCollision", PlayAnimationOnCollision);
TypeStore.add("PlayAnimationOnTrigger", PlayAnimationOnTrigger);
TypeStore.add("PlayAudioOnCollision", PlayAudioOnCollision);
TypeStore.add("PrefabSceneSwitcherSample", PrefabSceneSwitcherSample);
TypeStore.add("SceneSwitcherSample", SceneSwitcherSample);
TypeStore.add("StartPosition", StartPosition);
TypeStore.add("AutoReset", AutoReset);
TypeStore.add("TimedSpawn", TimedSpawn);
TypeStore.add("Variatns", Variatns);
TypeStore.add("VideoBackground", VideoBackground);
TypeStore.add("ResetPositionOnInterval", ResetPositionOnInterval);
TypeStore.add("ToggleVisibility", ToggleVisibility);
