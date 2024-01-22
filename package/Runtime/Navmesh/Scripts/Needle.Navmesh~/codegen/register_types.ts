import { TypeStore } from "@needle-tools/engine"

// Import types
import { Navmesh } from "../Navmesh.js";
import { NavmeshDemo_Agent } from "../NavmeshDemo_Agent.js";
import { NavmeshDemo_Controls } from "../NavmeshDemo_Controls.js";

// Register types
TypeStore.add("Navmesh", Navmesh);
TypeStore.add("NavmeshDemo_Agent", NavmeshDemo_Agent);
TypeStore.add("NavmeshDemo_Controls", NavmeshDemo_Controls);
