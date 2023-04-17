import { TypeStore } from "@needle-tools/engine"

// Import types
import { ModelLoading } from "../ModelLoading";
import { TextureLoading } from "../TextureLoading";

// Register types
TypeStore.add("ModelLoading", ModelLoading);
TypeStore.add("TextureLoading", TextureLoading);
