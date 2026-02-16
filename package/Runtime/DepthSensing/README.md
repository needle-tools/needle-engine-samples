# Depth Sensing

Create realistic AR experiences where virtual objects blend seamlessly with your real environment - they hide behind real furniture, walls, and other physical objects.

## Use Cases

Build immersive AR applications with realistic occlusion, virtual showrooms where products fit naturally into real spaces, or interactive AR games where characters move behind real-world obstacles.

## What This Sample Shows

- **Real-World Occlusion** - Virtual objects hide behind real-world objects using WebXR depth data
- **Visual Intersection Effects** - Bright cyan highlights appear where virtual objects meet real surfaces
- **Smart Transparency** - Occluded objects fade partially instead of disappearing completely, so you always know where they are
- **Interactive AR** - The `DragControls` component lets you move objects around in AR space

## How It Works

The `CustomDepthSensing` component enhances Three.js shaders with depth data from WebXR. It compares virtual object depth with real-world depth to create occlusion and intersection effects.

## Device Requirements

Currently supported in WebXR on Meta Quest devices (Quest 3, Quest Pro) with depth sensing capabilities. Support may expand to other WebXR-compatible devices in the future.

## Related Samples

- [ARBackground](https://engine.needle.tools/samples/ar-background/) - Access camera feed in AR sessions
- [AROccluders](https://engine.needle.tools/samples/ar-occluders/) - Use occluder geometry for AR integration