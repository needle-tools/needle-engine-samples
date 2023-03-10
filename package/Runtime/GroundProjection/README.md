# Ground Projection sample

[Equirectangular panoramas](https://polyhaven.com/hdris) can be used as a __skybox__, which is in fact a big sphere glued to the camera. So based on that, we can create a sphere and change its shape of it by for example flattening the bottom 40%. Now that shape resembles a hemisphere that is in a simpler form a sphere that has a floor. 

### With basic parameters, you can define this deformation and tweak that to your liking:

- Scale - sphere's scale
- Radius - density of the floor
- Height - density of the sides

This is a wrapper for [GroundProjectedEnv](https://threejs.org/examples/webgl_materials_envmaps_groundprojected.html) from Three.js

---

## RemoteSkybox

Is a component that lets you apply the skybox from other sources than the .glb file. This means that you can supply a link where the panorama is hosted instead of including it in the build, this can reduce the initial download size.

---

## Credits
```
Plane model
Author: Grapic_artplay
Source: https://sketchfab.com/3d-models/plane-low-poly-6f41d5adee2f4c71a3dca8c943829b7f
License: CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
```