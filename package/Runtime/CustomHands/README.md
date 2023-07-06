# Custom XR Hands

Tracked hands are a great way how to make your experience immersive! 

Your custom hand model needs a correct rig to be supported. Please refer to the example models in the scene under the `Hands` gameobject.

---

Custom hands are implemented via the WebXR component, in there you need to specific a runtime path to a directory that contains your build hand models.

This means, that you need to create 2 .glb files that contains your left and right hand. Simplest is to add your hands to your scene, disable them and add a `GltfObject` component the same way as it is done in this sample. Adding the component results in the scene to split into 3 glbs. One is the main .glb and then there's left and right hand .glb

It is important that the name of the hand gameobjects that have the `GltfObject` component on is exactly lowercase `right` or `left`. Currently the system will find the resulting .glbs by it's name.

So when we build the project we end up with 3 .glb files in the `dist/assets/` folder. 

That means in the WebXR component we specify to search for the .glbs at path `/`. That means the current directory from the perspective of the runtime.

You can also supply a URL to your hands and that's exactly what is happening when you set the path to an empty string. That results into this [url](https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/) from which the default hands are downlaoded.