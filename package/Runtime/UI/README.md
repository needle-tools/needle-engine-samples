# UI

These samples showcase the translation of Unity's UGUI system to Needle Engine components. 

A number of component types like panels, buttons, text are supported.  
Events on buttons can directly be set to trigger events on other components.  

Read more about [supported UI components](https://engine.needle.tools/docs/reference/components) in our docs.

## Screenspace UI (2D)

Screenspace UIs are an alternative to HTML and allow you to place UI elements right on the screen. You can anchor them to the screen edges or to other UI elements.  

## Worldspace UI (3D)

UI components inside a worldspace Canvas can be used to build spatial interfaces, for example for XR devices. 
They are rendered as part of the scene and can be occluded by other objects. 
You can add a `CanvasData` component to define how your 3D canvas should act in the 3D world.

# Fonts

Text components should reference a Font asset for export.  
You can import a font by adding the `.ttf` or `.otf` file into your project and assigning it to your Text components.  

To use font styles (bold/italic), make sure that you also have matching font assets – for example, `Arial-bold`.  
This also applies to [Rich Text](https://docs.unity3d.com/Packages/com.unity.ugui@1.0/manual/StyledText.html). 

By default, all characters referenced on all Text objects in your scene are exported. If you want to set text dynamically at runtime, you can extend this set:  add an `Font Additional Characters` component to your scene to specify what extra characters you want to export.  