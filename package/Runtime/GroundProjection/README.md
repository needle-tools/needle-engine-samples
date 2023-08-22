# Ground Projection sample

[Equirectangular panorama](https://polyhaven.com/hdris) is a form of projection for 360 photos which are often used as a __skybox__, which is in fact a big sphere glued to the camera. So based on that, we can create our sphere and change its shape by flattening the bottom 40% which results in a hemisphere with a beveled floor. And that is the principle behind Ground Projection.

### With basic parameters, you can define this deformation and tweak that to your liking:

- Scale - sphere's scale
- Radius - density of the floor
- Height - density of the sides

[GroundProjectedEnv](https://threejs.org/examples/webgl_materials_envmaps_groundprojected.html) from Three.js

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