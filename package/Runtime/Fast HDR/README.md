# FastHDR Environment Lighting

Photoreal HDR lighting and skyboxes on the web, without the wait. FastHDR is Needle Engine's compressed environment format — it loads up to **10× faster than EXR**, uses about **95% less GPU memory**, and streams in without frame drops, so image-based lighting stays smooth even on phones.

This sample compares an EXR environment against its FastHDR version. Assign an EXR or HDR texture as your skybox in Unity and Needle Engine converts it automatically on export: external maps become tiny `.pmrem.ktx2` files (~100–200 KB instead of several MB), while an internal Unity skybox stays bundled in the GLB. It's a drop-in replacement — no scene changes required.

**Learn more**
- [FastHDR documentation](https://engine.needle.tools/docs/explanation/fasthdr.html) — how it works
- [Needle Cloud HDRIs](https://cloud.needle.tools/hdris) — free, ready-to-use FastHDR environments

## Attributions
- Textures and models from [Poly Haven](https://polyhaven.com) — CC0
