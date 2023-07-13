# UI

These samples showcase the export of Unity's UGUI system to the web. 

## UI Types

### WorldSpace UI
You can add the CanvasData component to define how your 3D canvas should act in the 3D world.

### Screenspace UI
Is fundamentally an overlay so it will always be shown ontop of your scene.

## Font Export
Needle Engine automatically exports the font that is assigned in the *Text* component to the web. You can assign any of your own fonts.

Note: By default a character texture with all ASII characters and all characters found in the scene is generated. You can extend this list by either adding the `Font Addition Characters` component to your scene or by editing the Font asset and explictly assign the characters that should be exported.

## Further Information
UGUI utilizes a simple set of anchoring rules that you can [find here](https://docs.unity3d.com/Packages/com.unity.ugui@1.0/manual/UIBasicLayout.html).

Please also refer to the [list of supported components](https://engine.needle.tools/docs/component-reference.html#ui)
