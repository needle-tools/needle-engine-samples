# Ground Projection sample

[Equirectangular panoramas](https://polyhaven.com/hdris) can be used as a __skyboxes__, which is in fact a big sphere glued to the camera. So based on that, we can create a sphere and change its shape by for example flattening the bottom 40%. In other words, it is a hemisphere with a beveled floor.

### With basic parameters, you can define this deformation and tweak that to your liking:

- Scale - sphere's scale
- Radius - density of the floor
- Height - density of the sides

This is a wrapper for [GroundProjectedEnv](https://threejs.org/examples/webgl_materials_envmaps_groundprojected.html) from Three.js

---

## RemoteSkybox

Is a component that lets you download a skybox from other sources. This means that you can supply a link where the panorama is hosted instead of including it in the build, this can reduce the initial download size.

---

## Credits
```
Plane model
Author: Grapic_artplay
Source: https://sketchfab.com/3d-models/plane-low-poly-6f41d5adee2f4c71a3dca8c943829b7f
License: CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
```