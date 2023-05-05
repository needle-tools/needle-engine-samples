import { TypeStore } from "@needle-tools/engine"

// Import types
import { ModelLoading } from "../ModelLoading";
import { SkyboxPreviewer } from "../SkyboxPreviewer";
import { SkyboxWrapper } from "../SkyboxWrapper";
import { TextureLoading } from "../TextureLoading";

// Register types
TypeStore.add("ModelLoading", ModelLoading);
TypeStore.add("SkyboxPreviewer", SkyboxPreviewer);
TypeStore.add("SkyboxWrapper", SkyboxWrapper);
TypeStore.add("TextureLoading", TextureLoading);
