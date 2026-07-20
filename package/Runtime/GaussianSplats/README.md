# Gaussian Splatting

Render photorealistic real-world captures on the web with Gaussian Splatting. Bring 3D scans from Luma AI, Polycam or the original 3DGS pipeline into three.js and let anyone explore them straight in the browser — no plugins, no app install.

This sample streams a `.ply` or `.splat` point cloud into a splat renderer that draws millions of view-oriented gaussians in real time, with orbit controls for smooth navigation on desktop and mobile.

- Import `.ply` or `.splat` captures from Luma AI, Polycam or the official 3DGS tools
- Optionally define a cutout object to show only part of the scene
- Runs on desktop and mobile, with partial WebXR AR/VR support

**Learn more**
- [OrbitControls](https://engine.needle.tools/docs/api/OrbitControls)
- [WebXR](https://engine.needle.tools/docs/api/WebXR)

## Attributions
- [3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/) by Inria GraphDeco
- [aframe-gaussian-splatting](https://github.com/quadjr/aframe-gaussian-splatting/) by quadjr
