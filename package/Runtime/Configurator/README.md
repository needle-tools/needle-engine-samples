# Configurator

If we want to showcase the variety of a given product it's best to make a configurator that can serve as a way how to present your product to your customers.

This sample is focused on the configurator logic, other samples can showcase better user input, such as the Hotspot sample or VR Hands. For the best user experience, it's best to choose the type of input based on the application's concept and target platform.

---

This sample showcases how to switch between
 - GameObjects
 - Materials

Every switching mechanism has a base API to be called from outside of the object. That is crucial for the User input.

All switching mechanisms are based on the same class called `Configurator`. Which has this API to be interacted with:
 - next()
 - previous()
 - getSize()
 - currentIndex

It has also OnShow and OnHide events. This is important if we want to chain configurators after each other. A good example would be if we would have an object configurator where we would be switching between a plane and a car. And when we enable a car, it would also show that you can change the paint job.

If we want a configurator to be activated and deactivated at the same time as a parent, set the `Bind to parent` checkbox on every configurator.

`AutoInitialize` automatically chooses the first element and hides the rest right at the beginning.

`Loop selection` wraps the index selection, so if you are at the last element and you call next() it will choose the first element.

---

## Object Configurator

Switches game objects by turning them off and on based on the current index.

You can manually define the objects by populating the array in the editor or you can enable `Auto detect children` which searches for the objects in the configurator's children. Mind that it searches only for 1 depth in the hierarchy.

You can't add just game objects, since we want to support configurator chaining.

For simple objects that are not configurators, please add the `ConfigurationElement` to them so the `ObjectConfigurator` recognizes them.

### Sync Configurator Transform

Is often used with an object configurator and it updates the target's position when the OnShow event is triggered.

It's crucial to enable `Bind to parent` and that this is directly a child of the configuration element or other configurator. Alternatively, you can call `OnShow` on this class whenever you see fit to move the target.

This has a use case in this sample for the objects on the table. The two tables have different heights and every time you enable one of them, it moves the object to the position of the `SyncConfiguratorTransform` in world space. In other words, the position of the object that has the component works as a reference to which the target is "teleported".

## Material Configurator

Switches materials on a given material slot on a renderer. A good example would be a paint job on a car.

Simply drag & drop your Renderer to the variable in the inspector. That can be a MeshRenderer or a SkinnedMeshRenderer etc.

Then define the index of the material on the renderer. Mind that indexes start from 0.

And lastly, populate your Material array with the materials you want on your model.

---

You can always extend the Configurator and add your own.

Look at the Object Configurator as a reference on how to implement it. Mind always calling the `super. Method()` so the original logic still works. Even for events like `awake` or `start`.

---

# Attributions

```
Floating shelf
Author: 3D_for_everyone
Source: https://sketchfab.com/3d-models/floating-shelf-98bbcb64e36f40e2aa29cc766e63f15b
License: CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

Owen Retro Desk in Walnut
Author: stephen.curran1359
Source: https://sketchfab.com/3d-models/owen-retro-desk-in-walnut-002d04579ea64917b103283c82f460c6
License: CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

Living room - Furniture, Chairs, Sofa and Props
Author: Dr. Props
Source: https://sketchfab.com/3d-models/living-room-furniture-chairs-sofa-and-props-567712976c5148099b91abe5c580ba9e
License: CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

Laptop
Author: Aullwen
Source: https://sketchfab.com/3d-models/laptop-7d870e900889481395b4a575b9fa8c3e
License: CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

[FREE] Pilea Peperomioides Terracotta pot
Author: AllQuad
Source: https://sketchfab.com/3d-models/free-pilea-peperomioides-terracotta-pot-891b276aa29b4c42a0e3bc476203cb9b
License: CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

Plants are nice
Author: Manuagc
Source: https://sketchfab.com/3d-models/plants-are-nice-52704c1bafd44bfd9e98538276ad5614
License: CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

Ficus
Author: gilles.schaeck
Source: https://sketchfab.com/3d-models/ficus-e4999d6251ba42ac8ee2cea7d3e30596
License: CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
```