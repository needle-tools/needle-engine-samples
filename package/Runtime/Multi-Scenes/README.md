# Multi Scene Example

With Needle Engine it's **simple to load and unload interactive scenes** that bring their own objects, materials, lighting, cameras and interactive components. This idea is one of the fundamental concepts and pillars of Needle Engine which makes it so powerful. 

## How it works

### Export
Referenced Prefab and Scene Assets (in Unity) or Blend files (in Blender) in your components are exported as individual glTF scenes that can be loaded and instantiated into your scene at any time. All the necessary data is stored in those glTF files which can be loaded in either Needle Engine or any three.js based project.

### Loading
Use either the built-in [SceneSwitcher component](https://engine.needle.tools/docs/api/classes/Built-in_Components.SceneSwitcher.html) as a no-code solution or one of the options below:

- [AssetReference](https://engine.needle.tools/docs/api/classes/Engine_Core.AssetReference.html)
- [LoadAsset](https://engine.needle.tools/docs/api/functions/Engine_Core.loadAsset.html)

## Showcase Examples

[![](https://engine.needle.tools/samples/showcase/soc/thumbnail.webp)](https://engine.needle.tools/samples/songs-of-cultures/)
[Songs Of Cultures](https://engine.needle.tools/samples/songs-of-cultures/)

[![](https://engine.needle.tools/samples/showcase/needle%20website/thumbnail.webp)](https://engine.needle.tools/samples/needle-website)
[Needle Website](https://engine.needle.tools/samples/needle-website)