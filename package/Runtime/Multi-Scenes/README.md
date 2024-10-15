# Multi-scene

Scene is a collection of objects, while it also has extra data like lightamps, skybox and fog.

A scene is exported as a separate .glb file and thus it means the initial scene can be as slim as possible overall decreasing the initial download time.

Under the hood, the sample utilizes the [**AssetReference**](https://engine.needle.tools/docs/scripting.html#assetreference-and-addressables) class which ensures proper content handling and asynchronous loading.