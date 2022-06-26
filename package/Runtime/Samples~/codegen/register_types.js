import { TypeStore } from "needle.tiny.engine/engine/engine_typestore"

// Import types
import { ClickToOpenWebsite } from "../ClickToOpenWebsite.ts";
import { Clock } from "../Clock.ts";
import { HtmlMesh } from "../HtmlMesh.ts";
import { TextGeometry } from "../TextGeometry.ts";
import { TVScreen } from "../TVScreen.ts";

// Register types
TypeStore.add("ClickToOpenWebsite", ClickToOpenWebsite);
TypeStore.add("Clock", Clock);
TypeStore.add("HtmlMesh", HtmlMesh);
TypeStore.add("TextGeometry", TextGeometry);
TypeStore.add("TVScreen", TVScreen);
