# Deferred Textures

A basic [gltf-progressive](https://engine.needle.tools/docs/gltf-progressive/) sample that loads 3D content faster by deferring detail. It ships a small initial download with low-resolution textures and simplified geometry, then streams in the full-resolution textures and mesh detail on demand as they become visible on screen — so the scene appears quickly and sharpens up as needed.

This example keeps it deliberately simple, just a single mesh, to show the technique in isolation, but it defers both texture resolution and mesh level-of-detail. Fast initial load is a key factor for retention on the web: the sooner people see content, the more likely they stay, and deferring detail keeps that first paint small without giving up final quality.

Generating progressive assets by hand is fiddly — [Needle Cloud](https://cloud.needle.tools) does it for you automatically. Upload any 3D file and it optimizes the textures and meshes, builds the LODs, and serves the result from a global CDN, ready to load with gltf-progressive.

**Learn more**
- [gltf-progressive](https://engine.needle.tools/docs/gltf-progressive/) — how progressive loading works
- [Needle Cloud](https://cloud.needle.tools) — automatic 3D asset optimization and hosting

## Attributions
- [Male Armour – Game Ready](https://skfb.ly/oCGJx) by Kaan Tezcan — CC-BY 4.0
