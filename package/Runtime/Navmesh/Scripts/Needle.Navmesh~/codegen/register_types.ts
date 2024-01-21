import { TypeStore } from "@needle-tools/engine"

// Import types
import { Navmesh } from "../Navmesh.js";
import { NavmeshDemo_Controls } from "../NavmeshDemo_Controls.js";

// Register types
TypeStore.add("Navmesh", Navmesh);
TypeStore.add("NavmeshDemo_Controls", NavmeshDemo_Controls);
