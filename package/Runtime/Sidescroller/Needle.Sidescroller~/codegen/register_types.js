import { TypeStore } from "@needle-tools/engine"

// Import types
import { SidescrollerCamera } from "../SidescrollerCamera";
import { SidescrollerCharacter } from "../SidescrollerCharacter";
import { SidescrollerInfo } from "../SidescrollerInfo";

// Register types
TypeStore.add("SidescrollerCamera", SidescrollerCamera);
TypeStore.add("SidescrollerCharacter", SidescrollerCharacter);
TypeStore.add("SidescrollerInfo", SidescrollerInfo);
