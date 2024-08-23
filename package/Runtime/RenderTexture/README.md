# Render Texture

Render Texture is a special type of texture that contains an output directly from a camera. Instead of rendering to the screen, the camera renders to the texture. This texture can then be used in a material that can also use a custom shader.

## Setup
You can simply create a Render Texture asset, assign it to the camera in the "Output Texture" property and finally assign the render texture as the color map in your material.