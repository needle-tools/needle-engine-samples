Project-specific typescript files go here.  
Needle Engine will automatically generate matching C# "stub components" so you can attach them to objects in Unity.  

If you want to reuse components between multiple projects, a great way to do so are NpmDefs – reusable modules that contain both TypeScript and C# components.  

Learn more about scripting on the docs:  
https://docs.needle.tools/scripting

### Terrain Node Material
- `CreateTerrainNodeMaterial.ts`: builds a `three` `MeshPhysicalNodeMaterial` via Nodes for a 4-layer splat terrain (albedo + normal blending).
- `TerrainChunkNode.ts`: behaviour that applies the node-based material to the first mesh under the GameObject. Provide `splatMap`, four `baseMaps`, four `normalMaps`, optional `tiling` and `offset` per layer.