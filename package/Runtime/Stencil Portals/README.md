# Stencil sample

Stencil masking is a technique that can be used for making unrealistic spaces which do not make sense in real life. A good example of this is being utilized in a game called [Antichamber](https://en.wikipedia.org/wiki/Antichamber) where a [non-euclidean](https://en.wikipedia.org/wiki/Non-Euclidean_geometry) space is achieved thanks to stencil masks.

This works by including extra information for every pixel on the screen. Any model that is being rendered can access or write to that information. 

While we are rendering a model that is supposed to be inside the portal, we can ask the pixel if it was changed by the mask. If not, the model won't get rendered to that pixel and in the other case the opposite.

In other words, you need a mask that allows certain parts of the screen to display content from "another dimension" and to have content in said dimension.

This sample utilizes only 1 mask and one dimension, but it is already setup for 3 dimensions so you can create more complex effects from this sample.

To make a mask you only need to create a plane or other shape and give it a correct layer from the predefined 3 mask layers.

Then you want to mark your content with the "content" variant of the layer. Note that Mask 1 will enable you to see Content 1.

List of layers:
```
World_1_Mask
World_1_Content

World_2_Mask
World_2_Content

World_3_Mask
World_3_Content
```

These layers are not part of your project by default. You can find an autosetup tool in the root of the scene that will help you with adding them (Setup - Layer names).

All logic is defined in the URP asset (the renderer) which defines when and how a certain layer is rendered (`"URP/Sample Stencial URP Renderer"`). So if the effect DOESN'T work, it is most likely because the correct URP asset is not being used, please double check that you use the provided URP Asset (`"URP/Sample Stencial URP Settings"`). It has to be assigned in the `Project Settings/Graphics` and not override by the `Project Settings/Quality`.

Also to note, if you assign a content layer to your objects they'll disappear right away and are only visible while looking through a mask. So this means the effect should work right away in the editor. If it doesn't it means something went wrong. Please double-check everything or seek help on our discord.


## Important notice

- The stencil is supported only on URP
- Doesn't work well with post processing such as bloom

---

## Attribution
```
iPhone model
Author: Imagigoo
Source: https://sketchfab.com/3d-models/apple-iphone-14-pro-pack-free-2893bdaefdf946ab92ffd04ecfba843b
License: CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

Stylized planet
Author: cmzw
Source: https://sketchfab.com/3d-models/stylized-planet-789725db86f547fc9163b00f302c3e70
License: CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
```