import { TypeStore } from "@needle-tools/engine"

// Import types
import { ClickToOpenWebsite } from "../ClickToOpenWebsite";
import { Clock } from "../Clock";
import { HtmlButtonMesh } from "../HtmlButtonMesh";
import { TextMesh } from "../TextGeometry";
import { TextGeometry } from "../TextGeometry";
import { DisplayCameraView } from "../TVScreen";

// Register types
TypeStore.add("ClickToOpenWebsite", ClickToOpenWebsite);
TypeStore.add("Clock", Clock);
TypeStore.add("HtmlButtonMesh", HtmlButtonMesh);
TypeStore.add("TextMesh", TextMesh);
TypeStore.add("TextGeometry", TextGeometry);
TypeStore.add("DisplayCameraView", DisplayCameraView);
