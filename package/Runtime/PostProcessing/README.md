# Post Processing

Add cinematic post-processing to a 3D web scene — Bloom, Depth of Field, Tone Mapping, Color Correction, and Screen Space Ambient Occlusion — set up visually in Unity and running in the browser with Needle Engine. No shader code required.

On URP you configure effects with Unity's **Volume** system: add a **Global** Volume, create a profile, and add effects from the built-in list. Unity's and Needle's value ranges differ, so expect a little tweaking to match the runtime look — the experimental EditorSync component speeds that up. Screen Space Ambient Occlusion is added as a component on your camera.

Post-processing export is currently URP-only. From the Built-in render pipeline you can still set effects up in code at runtime.

**Learn more**
- [PostProcessing](https://engine.needle.tools/docs/api/PostProcessing) — API reference
- [Volume](https://engine.needle.tools/docs/api/Volume) — set up effects with profiles
- [Feature overview](https://engine.needle.tools/docs/explanation/core-concepts/features-overview) — docs
