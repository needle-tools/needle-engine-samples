# Reflection Probes

Reflections are an important aspect while lighting your scene. Often your scene will need unique reflections for different parts. 

## Usage

Set the `Anchor Override` in the MeshRenderer component to the ReflectionProbe that you want to apply.   
Note: We currently only support reflection probes when the anchor override is set. Bounds or volumes are not checked.

## Where to get a cubemap?
 
### Baked
For immersive reflections, it is recommended to bake them from the environment. You can do that right from a reflection probe by selecting `Type: Baked` and hitting the Bake button down below.

### Custom
Alternatively, you can import any [equirectangular panorama](https://polyhaven.com/hdris), and in the import settings, you can change the `Texture shape: cube`.   
This way then, you can assign it to the reflection probe after setting the `Type: Custom`.
