# UI

Unity has a ui system refered to as ugui that utilizes gameobjects and components on them. To not be missplaced with the other UI system refer to as UI Toolkit.

UGUI utilizes a simple set of anchoring rules that you can [find here](https://docs.unity3d.com/Packages/com.unity.ugui@1.0/manual/UIBasicLayout.html).

A canvas can be world space or screen space. 

## Canvas types
### World Space canvas
You can add the CanvasData component to define how your 3D canvas should act in the 3D world.

#### Screen space canvas
Is fundamentally an overlay so it will always be shown ontop of your scene.

## Components
There is only a initial subset of UI components supported, please refer to [the official list](https://engine.needle.tools/docs/component-reference.html#ui).

## Font
TODO: move from Fonts dedicated sample