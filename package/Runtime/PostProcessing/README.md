# Post Processing

This is an example scene to show off some of the supported postprocessing effects.   
There are many common effects that artists are used to working with,   
ranging from color grading to more complex effects such as `Depth of Field`, `Antialiasing` or `Screen Space Ambient Occlusion`.

## Usage
1) Add the `Volume` component to your camera
2) Create a new profile
3) add your effects from the built-in list
4) enable properties of the effect and observer them in the game/scene view

## Troubleshooting
### I can't see the effect anywhere in the editor
- **Post processing is only supported in URP**. Make sure that your project has the `Universal RP` package and that you set a URP asset in the `Projects Settings/Graphics`.
- Make sure that you have the volume on the camera / the volume is large enough to contain the camera.
- Enable "Post Processing" on the camera
- Enable "Post Processing" in your URP Asset 
### I can't see the effect in the scene view
- Check if post processing is enabled in the toggle setting that is located close to the other settings related to lighting and shading in the scene window.

