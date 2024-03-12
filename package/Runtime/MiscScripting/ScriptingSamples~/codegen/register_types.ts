/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { ClickToOpenWebsite } from "../ClickToOpenWebsite.js";
import { Clock } from "../Clock.js";
import { HtmlButtonMesh } from "../HtmlButtonMesh.js";
import { SerializedDataSample } from "../SerializedDataSample.js";
import { DisplayCameraView } from "../TVScreen.js";
import { TextMesh } from "../TextGeometry.js";
import { TextGeometry } from "../TextGeometry.js";

// Register types
TypeStore.add("ClickToOpenWebsite", ClickToOpenWebsite);
TypeStore.add("Clock", Clock);
TypeStore.add("HtmlButtonMesh", HtmlButtonMesh);
TypeStore.add("SerializedDataSample", SerializedDataSample);
TypeStore.add("DisplayCameraView", DisplayCameraView);
TypeStore.add("TextMesh", TextMesh);
TypeStore.add("TextGeometry", TextGeometry);
