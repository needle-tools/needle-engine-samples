/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { FaceFilterRoot } from "../src/Behaviours.js";
import { FaceFilterHeadPosition } from "../src/Behaviours.js";
import { FaceFilterBlendshapes } from "../src/Behaviours.js";
import { FaceFilterAnimator } from "../src/Behaviours.js";
import { Facefilter } from "../src/FaceFilter.js";
import { NeedleOcclusionMesh } from "../src/HelperComponents.js";
import { NeedleBackgroundMesh } from "../src/HelperComponents.js";
import { NeedleRecordingHelper } from "../src/RecordingHelper.js";

// Register types
TypeStore.add("FaceFilterRoot", FaceFilterRoot);
TypeStore.add("FaceFilterHeadPosition", FaceFilterHeadPosition);
TypeStore.add("FaceFilterBlendshapes", FaceFilterBlendshapes);
TypeStore.add("FaceFilterAnimator", FaceFilterAnimator);
TypeStore.add("Facefilter", Facefilter);
TypeStore.add("NeedleOcclusionMesh", NeedleOcclusionMesh);
TypeStore.add("NeedleBackgroundMesh", NeedleBackgroundMesh);
TypeStore.add("NeedleRecordingHelper", NeedleRecordingHelper);
