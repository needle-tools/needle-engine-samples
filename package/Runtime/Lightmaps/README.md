# Switching lightmaps

This sample shows how to easily bake multiple lightmaps in Unity and switch between them at runtime. The sample includes a small lightmap baker editor script that provides the functionality and stores the baked lightmap textures to be exported to the web. 

## Components

### Lightmap Baker
The lightmap baker is an editor-only script where you define your lightmap variants. Every variant has a set of objects and a set of emissive materials. When a variant is selected, the assigned objects will be activated, and all objects from the other variants will be deactivated. Similarly, the material's emission will be turned on and off.

If you open the sample for the first time please navigate to this component and click `Bake All` (Located on the `Lightmaps` GameObject). This is necessary because we don't ship pre-baked lightmaps with the sample package to keep the size of the package small when installing it.

### Lightmap Configurations
Lightmap Baker populates this component with the resulting lightmap variants, and it supplies the runtime API to control lightmap switching.

The default behaviour is that it cycles through all the lightmaps. You can change the cycle style by enabling ping-pong, so the selection looks like this: `1 2 3 2 1 2 3` instead of `1 2 3 1 2 3 `.

You can turn off the automatic switching by disabling the `autoSwitch` boolean. 

To switch to a specific lightmap, use the `setLightmap(index)`, and for manual cycling, use the `selectNext()`. You can create a simple UI menu and call these methods directly from the buttons.

## Use cases

### Scene light
Differentiate between day & night with atmospheric lighting.

### Glowing object
One example would be a lamp and turning it on & off. Or turning a car's lights on & off and accompanied by an engine start sound and flares.