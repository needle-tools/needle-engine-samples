/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { FaceBehaviour } from "../FaceBehaviour.js";
import { FaceBlendshapes } from "../FaceBehaviour.js";
import { FaceAnimator } from "../FaceBehaviour.js";
import { Facefilter } from "../FaceFilter.js";
import { NeedleOcclusionMesh } from "../HelperComponents.js";
import { NeedleBackgroundMesh } from "../HelperComponents.js";
import { NeedleRecordingHelper } from "../RecordingHelper.js";

// Register types
TypeStore.add("FaceBehaviour", FaceBehaviour);
TypeStore.add("FaceBlendshapes", FaceBlendshapes);
TypeStore.add("FaceAnimator", FaceAnimator);
TypeStore.add("Facefilter", Facefilter);
TypeStore.add("NeedleOcclusionMesh", NeedleOcclusionMesh);
TypeStore.add("NeedleBackgroundMesh", NeedleBackgroundMesh);
TypeStore.add("NeedleRecordingHelper", NeedleRecordingHelper);
