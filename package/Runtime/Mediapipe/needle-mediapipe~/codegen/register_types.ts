/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { Facefilter } from "../Facefilter.js";
import { MediapipeHands } from "../MediapipeHands.js";
import { ParticleSphere } from "../ParticleSphere.js";

// Register types
TypeStore.add("Facefilter", Facefilter);
TypeStore.add("MediapipeHands", MediapipeHands);
TypeStore.add("ParticleSphere", ParticleSphere);
