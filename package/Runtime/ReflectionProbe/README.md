# Reflection Probes

Reflections are an important aspect while lighting your scene. Sometimes your scene will need unique reflections for parts that have Chrome materials, it's often desirable to have reflections that are different from their surroundings for better clarity.

## Usage

Set the `Anchor Override` in the MeshRenderer component to the ReflectionProbe that you want to apply.
Note: Currently, volumes are not supported.

## Where to get a cubemap?
 
### Rendered from your scene"
For immersive reflections, it is recommended to bake them from the environment. You can do that right from a reflection probe by selecting `Type: Baked` and hitting the Bake button down below.

### Custom 360° image
Alternatively, you can import any [equirectangular panorama](https://polyhaven.com/hdris), and in the import settings, you can change the `Texture shape: cube`.   
That texture is now assignable in the reflection probe inspector after setting the probe's type to `Custom`.
