# Rendering Gaussian Splats

Gaussian Splatting is a novel rendering technique where a point cloud with stretched particles – so-called "gaussians" – is optimized to fit a mesh. 

The original paper can be found here: https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/.

The renderer implementation inside Needle Engine is based on https://github.com/quadjr/aframe-gaussian-splatting/.  

## Creating Gaussian Splatting files

There are at least two online solutions for creating the files in addition to the official source code:  
- [Luma Labs](https://lumalabs.ai/interactive-scenes) 
- [PolyCam](https://poly.cam/gaussian-splatting) 

Follow the instructions there to create your own captures.  

## Using splat files inside Needle Engine

- download a .ply file for your capture (called "PLY" or "Splats")
- put it into your web project at `include/<myFile.ply>`
- in the scene, reference the file path from a `SplatRenderer` component
- (optional) specify a cutout object to only show parts of the rendering
    - the splat file will currently *not* be previewed inside the editor. This functionality may be added at a later point.

*Note:* .splat files are also supported.

## Partial VR and AR support

The current rendering implementation is well suited for desktop and mobile use, but is not fast enough for Quest VR/AR usage. 