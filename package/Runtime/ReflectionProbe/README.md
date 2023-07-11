# Reflection Probes

Reflections are an important aspect while lighting your scene. Often your scene will need unique reflections for different parts. 

## Usage

A reflection probe has a box volume in which all objects use the probe as the reflection source. This selection is object-based and not vertex-based. So you might want to separate your meshes accordingly. 

You can also override every MeshRenderer's position for the probe calculation by setting the `Anchor Override` in the editor.

## Where to get a cubemap?
 
### Baked
For immersive reflections, it is recommended to bake them from the environment. You can do that right from a reflection probe by selecting `Type: Baked` and hitting the Bake button down below.

### Custom
Alternatively, you can import any [equirectangular panorama](https://polyhaven.com/hdris), and in the import settings, you can change the `Texture shape: cube`. This way then, you can assign it to the reflection probe after setting the `Type: Custom`.