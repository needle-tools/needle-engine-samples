/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { FaceBehaviour } from "../FaceBehaviour.js";
import { FaceBlendshapes } from "../FaceBehaviour.js";
import { Facefilter } from "../FaceFilter.js";
import { NeedleRecordingHelper } from "../RecordingHelper.js";

// Register types
TypeStore.add("FaceBehaviour", FaceBehaviour);
TypeStore.add("FaceBlendshapes", FaceBlendshapes);
TypeStore.add("Facefilter", Facefilter);
TypeStore.add("NeedleRecordingHelper", NeedleRecordingHelper);
