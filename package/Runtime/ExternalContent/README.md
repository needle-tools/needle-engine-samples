# External Content

Build dynamic applications that load 3D models, textures, and audio from any URL at runtime - perfect for content management systems, user-generated content, or keeping your initial bundle size small.

## Use Cases

Create product configurators that load models on-demand, build platforms for user-generated 3D content, integrate with content management systems, or reduce initial loading times by fetching assets only when needed.

## What This Sample Shows

Three different loading components demonstrate runtime asset loading:

**ModelLoading** - Uses Needle's `AssetReference` to load glTF/GLB models from any URL, with automatic cleanup and URL parameter support (`?model=URL`)

**TextureLoading** - Loads images as textures using `ImageReference`, applies them to materials with proper settings

**AudioLoading** - Fetches and plays audio files from external sources, creating `AudioSource` components dynamically as needed

All components support URL parameters for easy testing with different assets.

## Documentation

- [AssetReference API](https://engine.needle.tools/docs/api/AssetReference)
- [Lazy Loading & Multiple Scenes](https://engine.needle.tools/docs/how-to-guides/export/#lazy-loading-multiple-scenes)
- [Scripting: Create Components](https://engine.needle.tools/docs/how-to-guides/scripting/create-components)
