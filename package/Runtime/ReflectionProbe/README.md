# Reflection Probes

Assign a custom environment map per object for accurate, controllable reflections on the web. Instead of every surface reflecting one global skybox, reflection probes let you give each object — or a group of objects in a volume — its own reflection map, so chrome, glossy, and metallic materials look exactly right. This is key for product visualization and high-quality configurators, where believable lighting and clean reflections make or break the result.

Assign a reflection probe to an object via **Anchor Override** on its renderer, and give the probe a custom environment map — for example an [equirectangular panorama](https://polyhaven.com/hdris) — so that surface reflects exactly what you want. Reflection probes work from both the Unity and Blender integrations.

**Learn more**
- [ReflectionProbe](https://engine.needle.tools/docs/api/ReflectionProbe) — API reference
