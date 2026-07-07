# Material X

Bring film- and VFX-grade materials to the web: this sample renders **MaterialX** shaders live in the browser with Needle Engine, so the same industry-standard materials used in Maya, Houdini, and Omniverse run at full fidelity on any device.

It shows how a Unity Shader Graph material exports to a MaterialX graph and renders at runtime through [`@needle-tools/materialx`](https://www.npmjs.com/package/@needle-tools/materialx) — Needle's library that brings the MaterialX runtime, compiled to WebAssembly, to three.js. Lighting, layered surfaces, and PBR detail stay intact, with no engine-specific shader rewrites.

- Export Shader Graph materials to MaterialX automatically from Unity
- Supports OpenPBR, Standard Surface, and UsdPreviewSurface nodes
- Image-based lighting, contact shadows, and multiple light sources

**Learn more**

- [MaterialX export guide](https://engine.needle.tools/docs/how-to-guides/export/materialx.html)
- [MaterialX standard (materialx.org)](https://materialx.org/)
- [ContactShadows component](https://engine.needle.tools/docs/api/ContactShadows)
