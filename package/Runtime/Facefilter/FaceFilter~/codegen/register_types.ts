/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { FaceBehaviour } from "../src/FaceBehaviour.js";
import { FaceBlendshapes } from "../src/FaceBehaviour.js";
import { FaceAnimator } from "../src/FaceBehaviour.js";
import { Facefilter } from "../src/FaceFilter.js";
import { NeedleOcclusionMesh } from "../src/HelperComponents.js";
import { NeedleBackgroundMesh } from "../src/HelperComponents.js";
import { NeedleRecordingHelper } from "../src/RecordingHelper.js";

// Register types
TypeStore.add("FaceBehaviour", FaceBehaviour);
TypeStore.add("FaceBlendshapes", FaceBlendshapes);
TypeStore.add("FaceAnimator", FaceAnimator);
TypeStore.add("Facefilter", Facefilter);
TypeStore.add("NeedleOcclusionMesh", NeedleOcclusionMesh);
TypeStore.add("NeedleBackgroundMesh", NeedleBackgroundMesh);
TypeStore.add("NeedleRecordingHelper", NeedleRecordingHelper);
