# Render Texture

This sample shows how to use a RenderTexture to display the output of a camera on a TV screen.    

A RenderTexture can be assigned to a camera to output a camera view into a texture. This texture can then be assigned to objects and materials in your scene to be displayed or as input for custom shaders.  

## Setup

1) Create a new RenderTexture asset in your project window with `Create/RenderTexture`
2) Assign the Texture to the camera's `Output Texture` slot (in this scene in the "Tripod Camera" object)
3) Assign the Texture to an object in your scene (in this scene in the "TV" object)