# External Content

Load 3D models, textures, and audio from any URL at runtime, in the browser. Perfect for content management systems, user-generated content, or keeping your initial bundle small by fetching assets only when they're needed — build a configurator that loads models on demand, or a platform for user-uploaded 3D.

Three components show the pattern:

- **ModelLoading** — loads glTF/GLB from any URL with Needle's `AssetReference`, with automatic cleanup and `?model=URL` support
- **TextureLoading** — loads images as textures via `ImageReference` and applies them to materials
- **AudioLoading** — fetches and plays external audio, creating `AudioSource` components on the fly

All three take URL parameters, so you can test with different assets straight from the address bar.

**Learn more**
- [AssetReference](https://engine.needle.tools/docs/api/AssetReference) — API reference
- [Exporting & lazy loading](https://engine.needle.tools/docs/how-to-guides/export/#lazy-loading-multiple-scenes) — docs
- [Create Components](https://engine.needle.tools/docs/how-to-guides/scripting/create-components) — scripting guide
