import { TypeStore } from "@needle-tools/engine"

// Import types
import { SidescrollerCamera } from "../SidescrollerCamera.js";
import { SidescrollerCharacter } from "../SidescrollerCharacter.js";
import { SidescrollerInfo } from "../SidescrollerInfo.js";

// Register types
TypeStore.add("SidescrollerCamera", SidescrollerCamera);
TypeStore.add("SidescrollerCharacter", SidescrollerCharacter);
TypeStore.add("SidescrollerInfo", SidescrollerInfo);
