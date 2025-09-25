/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { CustomShaderMaterial } from "../Terrain/CreateTerrainMaterial.js";
import { TerrainChunk } from "../Terrain/TerrainChunk.js";
import { TerrainChunk_ } from "../Terrain/TerrainChunk_.js";

// Register types
TypeStore.add("CustomShaderMaterial", CustomShaderMaterial);
TypeStore.add("TerrainChunk", TerrainChunk);
TypeStore.add("TerrainChunk_", TerrainChunk_);
