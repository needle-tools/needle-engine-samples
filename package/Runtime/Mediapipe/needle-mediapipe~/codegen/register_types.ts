/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { Facefilter } from "../Facefilter.js";
import { MediapipeHands } from "../MediapipeHands.js";
import { ParticleSphere } from "../ParticleSphere.js";
import { NeedleRecordingHelper } from "../utils.js";

// Register types
TypeStore.add("Facefilter", Facefilter);
TypeStore.add("MediapipeHands", MediapipeHands);
TypeStore.add("ParticleSphere", ParticleSphere);
TypeStore.add("NeedleRecordingHelper", NeedleRecordingHelper);
