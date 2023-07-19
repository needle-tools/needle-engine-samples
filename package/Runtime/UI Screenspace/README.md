# User Interfaces

These samples showcase the translation of Unity's UGUI system to Needle Engine components. 

## Types of UI rendering

### Worldspace UI
Worldspace UIs are used to place UI elements in the 3D world. They are rendered as part of the scene and can be occluded by other objects. 
You can add a `CanvasData` component to define how your 3D canvas should act in the 3D world.

### Screenspace UI
Screenspace UIs are an alternative to HTML and allow you to place UI elements right on the screen. You can anchor them to the screen edges or to other UI elements.  

## Font Export
Font files referenced from `Text` components (legacy - not TMPro at the moment) are automatically converted for use in Needle Engine.

By default, all ASCII characters and all characters found in the scene are exported and available at runtime. If you plan to change text dynamically, you can add the `Font Addition Characters` component to your scene and specify additional characters, or by editing the Font asset and explictly assigning the characters that should be exported.  

## Learn More

Read about [supported UI components](https://engine.needle.tools/docs/component-reference.html#ui) in our docs.