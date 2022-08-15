import { TypeStore } from "@needle-tools/engine/engine/engine_typestore"

// Import types
import { ClickToOpenWebsite } from "../ClickToOpenWebsite.ts";
import { Clock } from "../Clock.ts";
import { HtmlMesh } from "../HtmlMesh.ts";
import { TextMesh } from "../TextGeometry.ts";
import { TextGeometry } from "../TextGeometry.ts";
import { DisplayCameraView } from "../TVScreen.ts";

// Register types
TypeStore.add("ClickToOpenWebsite", ClickToOpenWebsite);
TypeStore.add("Clock", Clock);
TypeStore.add("HtmlMesh", HtmlMesh);
TypeStore.add("TextMesh", TextMesh);
TypeStore.add("TextGeometry", TextGeometry);
TypeStore.add("DisplayCameraView", DisplayCameraView);
