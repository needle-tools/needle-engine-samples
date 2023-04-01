import { TypeStore } from "@needle-tools/engine"

// Import types
import { SidescrollerCamera } from "../SidescrollerCamera";
import { SidescrollerCharacter } from "../SidescrollerCharacter";

// Register types
TypeStore.add("SidescrollerCamera", SidescrollerCamera);
TypeStore.add("SidescrollerCharacter", SidescrollerCharacter);
