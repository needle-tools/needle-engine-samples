# Diamond Ring

This sample demonstrates rendering realistic refractive gems with a custom shader.

### Custom Shader

The `Diamond.ts` script handles the custom shader. It uses an external dependency, `three-mesh-bvh` to accurately calculate internal reflections and refractions in a way that is feasible for mobile devices and AR.  
The number of bounces and other parameters can be adjusted directly in the code. On mobile, faster settings are used by default. 

### Light Baking

The pedestal has been baked in Blender's Cycles renderer. Baking there supports caustics and other refractive/reflective effects, which increases realism beyond what a typical game engine light bake can do.