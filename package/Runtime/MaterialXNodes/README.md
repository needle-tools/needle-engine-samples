# MaterialX in Needle Engine

[MaterialX](https://materialx.org/) is a powerful standard for describing materials and shaders in a graph-based way, independent of the rendering engine. It allows you to define complex materials with multiple surface layers and realistic lighting.

It's widely used across film, VFX, and e-commerce, and is supported by many professional authoring tools such as Autodesk Maya and 3ds Max, Houdini, V-Ray, and Omniverse.

**📖 [Read the full MaterialX documentation](https://engine.needle.tools/docs/how-to-guides/export/materialx.html)**

## Key Features

- **Shader Graph to MaterialX Export**: Materials made with Unity's Shader Graph can be exported to MaterialX files automatically
- **High Fidelity**: Uses the official [MaterialX JavaScript library](https://github.com/materialx/MaterialX) for accurate material representation
- **WebGPU Ready**: Future-proof material export that extends beyond WebGL2 shaders
- **Full Material Support**: Supports OpenPBR, Standard Surface, UsdPreviewSurface, and Unlit Surface nodes
- **Advanced Features**: Image-Based Lighting, Reflection Probes, multiple light sources, texture compression, and animated properties

## Quick Start

### Unity Setup

1. Select the Needle Engine component in your scene
2. In the Inspector, find "NpmDef Dependencies" and add the `Needle MaterialX` package
3. Create materials with Shader Graph
4. Set "MaterialX" as the Shader Export Type in the material properties

### three.js Usage

```typescript
import { useNeedleMaterialX } from "@needle-tools/materialx";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const gltfLoader = new GLTFLoader();
useNeedleMaterialX(gltfLoader);

gltfLoader.load("your-file.glb", (gltf) => {
    scene.add(gltf.scene);
});
```

## Resources

- [MaterialX Documentation](https://engine.needle.tools/docs/how-to-guides/export/materialx.html)
- [MaterialX Official Website](https://www.materialx.org/)
- [MaterialX Editor (GitHub)](https://github.com/AcademySoftwareFoundation/MaterialX)
- [StackBlitz Examples](https://stackblitz.com/@marwie/collections/materialx)
- [three.js MaterialX Support](https://github.com/mrdoob/three.js/issues/24674)
