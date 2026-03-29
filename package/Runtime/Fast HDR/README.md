# Fast HDR

Needle Engine's Fast HDR format enables high-quality HDR environment lighting and skyboxes at a fraction of the file size compared to traditional formats like EXR or HDR.

**[Read the full Fast HDR documentation](https://engine.needle.tools/docs/explanation/fasthdr.html)**

## Key Features

- **Tiny File Sizes**: HDR environment maps compressed to ~100-200 KB instead of several MB
- **Fast Loading**: Quick download and decode times for better user experience
- **High Quality**: Preserves HDR lighting information for accurate reflections and environment lighting
- **Easy to Use**: Drop-in replacement for EXR/HDR skyboxes in your scenes

## Usage

1. Add a `Camera` with a skybox background to your scene
2. Assign an EXR or HDR texture as the environment/skybox — Needle Engine will automatically convert it to the Fast HDR format on export
3. On export, external EXR/HDR textures are converted to `.pmrem.ktx2` files, significantly reducing download size. If the skybox is an internal Unity Skybox texture, it stays bundled inside the GLB as a single file.

## Resources

- [Fast HDR Documentation](https://engine.needle.tools/docs/explanation/fasthdr.html)
- [Needle Cloud HDRIs](https://cloud.needle.tools/hdris) — Free HDR environment maps ready to use

## Credits

Textures and models used in this sample are from [Poly Haven](https://polyhaven.com), licensed under CC0.
