# USD

USD, which stands for Universal Scene Definition, is a format developed by Pixar similar to Gltf. There are more variants, such as USDA, USDC but the most efficient for our use is USDZ.

Apple's quicklook is an application to preview files such as photos, pdfs and other popular formats. On iOS it also supports AR experience with that USDZ scene. 

And since the software that is displaying and controlling that USDZ is not our application, there's a natural limit that you can't execute any code to control how that scene behaves. Luckily there is a limited API to animate and move objects.

# Everywhere Actions

On Android, on the other hand, a standard called WebXR is supported, which means the AR experience is running directly inside our application and so we can control anything in the scene.

To be able to have a cross-platform experience, there are [Everywhere Actions](https://engine.needle.tools/docs/everywhere-actions.html#what-are-everywhere-actions). A set of simple actions that work on all platforms in both WebXR and QuickLook.

# Samples

## USDZ Interactivity

Showcases the basic actions in isolated use cases.

## USDZ Characters

By using relative movement actions, you are able to make minigames with characters like these that work everywhere, including iOS AR.

## USDZ Product

Simple configurator showcasing high-quality assets and materials for both the web and automatic conversion to QuickLook / USDZ.

## Musical Instrument

Demonstrates animation and audio playback on click.