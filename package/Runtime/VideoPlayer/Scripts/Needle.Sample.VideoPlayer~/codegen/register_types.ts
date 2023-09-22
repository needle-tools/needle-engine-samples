import { TypeStore } from "@needle-tools/engine"

// Import types
import { CombinedVideo } from "../CombinedVideo.js";
import { SampleVideo } from "../SampleVideo.js";

// Register types
TypeStore.add("CombinedVideo", CombinedVideo);
TypeStore.add("SampleVideo", SampleVideo);
