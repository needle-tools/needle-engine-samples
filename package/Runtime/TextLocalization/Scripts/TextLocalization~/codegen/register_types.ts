/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { LocalizedEntry } from "../LocalizationManifest.js";
import { LocalizationManifestEntry } from "../LocalizationManifest.js";
import { LocalizationManifest } from "../LocalizationManifest.js";
import { LocalizedText } from "../LocalizedText.js";

// Register types
TypeStore.add("LocalizedEntry", LocalizedEntry);
TypeStore.add("LocalizationManifestEntry", LocalizationManifestEntry);
TypeStore.add("LocalizationManifest", LocalizationManifest);
TypeStore.add("LocalizedText", LocalizedText);
