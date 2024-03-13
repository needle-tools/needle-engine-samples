/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { AudioLoading } from "../AudioLoading.js";
import { ModelLoading } from "../ModelLoading.js";
import { SkyboxPreviewer } from "../SkyboxPreviewer.js";
import { SkyboxWrapper } from "../SkyboxWrapper.js";
import { TextureLoading } from "../TextureLoading.js";

// Register types
TypeStore.add("AudioLoading", AudioLoading);
TypeStore.add("ModelLoading", ModelLoading);
TypeStore.add("SkyboxPreviewer", SkyboxPreviewer);
TypeStore.add("SkyboxWrapper", SkyboxWrapper);
TypeStore.add("TextureLoading", TextureLoading);
