/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { PanoramaViewer } from "../PanoramaViewer.js";
import { PanoramaViewerSample } from "../PanoramaViewerSample.js";
import { PanoramaViewerUI } from "../PanoramaViewerUI.js";
import { PanoramaViewerUI_Timeline } from "../PanoramaViewerUI.js";

// Register types
TypeStore.add("PanoramaViewer", PanoramaViewer);
TypeStore.add("PanoramaViewerSample", PanoramaViewerSample);
TypeStore.add("PanoramaViewerUI", PanoramaViewerUI);
TypeStore.add("PanoramaViewerUI_Timeline", PanoramaViewerUI_Timeline);
