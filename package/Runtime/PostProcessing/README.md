# Post Processing

As the name suggests, it is a way how to add effects after a frame is rendered. There are many common effects that artists are used to working with, ranging from color grading to more complex effects such as `Depth of Field`, `Antialiasing` or `Screen Space Ambient Occlusion`.

## Usage

- Simplest is to add the `Volume` component to your camera
- Create a new profile
- add your effects from the built-in list
- enable properties of the effect and observer them in the game/scene view

## Troubleshooting
### I can't see the effect in the runtime, but I can in the editor
- Not every post processing effect is implemented. Please let us know in the forum if you lack a certain effect and what is your use case 🌵.
### I can't see the effect anywhere in the editor
- **Post processing is only supported in URP**. Make sure that your project has the `Universal RP` package and that you set a URP asset in the `Projects Settings/Graphics`.
- Make sure that you have the volume on the camera / the volume is large enough to contain the camera.
- Enable "Post Processing" on the camera
- Enable "Post Processing" in your URP Asset 
### I can't see the effect in the scene view
- Check if post processing is enabled in the toggle setting that is located close to the other settings related to lighting and shading in the scene window.

