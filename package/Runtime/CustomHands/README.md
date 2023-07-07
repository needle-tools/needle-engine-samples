# Custom XR Hands

Tracked hands are a great way how to make your experience immersive! 

Your custom hand model needs the correct rig to be supported. Please refer to the example models in the scene under the `Hands` gameobject.

---

Custom hands are implemented via the WebXR component. In there, you need to specify a runtime path to a directory that contains your build hand models.

This means that you need to create two .glb files that contain your left and right hand. The simplest is to add your hands to your scene, disable them and add a `GltfObject` component the same way as it is done in this sample. Adding the component results in the scene splitting into three glbs. One is the main .glb, and then there are left and right hand .glb

It is important that the name of the hand gameobjects that have the `GltfObject` component is exactly lowercase `right` or `left`. Currently, the system will find the resulting .glbs by its name.

So when we build the project, we end up with three .glb files in the `dist/assets/` folder. 

That means in the WebXR component, we specify to search for the .glbs at path `/`. That means the current directory from the perspective of the runtime.

You can also supply a URL to your hands, and that's exactly what happens when you set the path to an empty string. That results in this [url](https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/) of default hands.