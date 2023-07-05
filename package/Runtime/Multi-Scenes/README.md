# Multi-scene

This sample is comprised of 2 scenes. 

### Utilizing prefabs
Scene name: `Multi Scenes (Prefabs)`

Prefabs are objects which contain components. Objects can have children.

### Utilizing scenes
scene name: `Multi Scenes`

The scene is a collection of such objects, but it has extra information and built-in features like lightmaps and the embedded skybox. So if you want to bake lighting, it is ideal to use scenes.

---

In reality, both scenes and prefabs are exported as separate .glb files and since they are separate, it means this should significantly reduce the initial download size. This is a recommended way how to handle large applications in a single needle instance.

Under the hood, the sample utilizes the [**AssetReference**](https://engine.needle.tools/docs/scripting.html#assetreference-and-addressables) which ensures proper content handling and asynchronous loading. 

