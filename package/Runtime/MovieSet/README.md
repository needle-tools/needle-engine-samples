# Movie Set

This sample shows how to use RenderTexture to display the output of a camera onto a 3D model.

A RenderTexture can be assigned to a camera to output the camera's view into a texture. This texture can then be assigned to materials in your scene as you would with any other texture.

## Setup

1) Create a new RenderTexture asset in your project window with `Create/RenderTexture`
2) Assign the Texture to the camera's `Output Texture` slot (in this scene in the "Tripod Camera" object)
3) Assign the Texture to an object in your scene (in this scene in the "TV" object)