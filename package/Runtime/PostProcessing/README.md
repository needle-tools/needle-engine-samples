# Post Processing

This sample demonstrates post processing effects in Needle Engine and how they can be set up from Unity. 
Effects such as `Depth of Field`, `Bloom`, `Tone Mapping`, `Color Correction` or `Screen Space Ambient Occlusion` are supported. On URP, they can be set up using Unity's Volume system.  

## Usage

- Add a `Volume` component in your scene and make sure it's set to `Global`.
- Create a new profile
- Add your effects from the built-in list
- Enable properties of the effect and observer them in the game/scene view

As the range of supported values between Unity's postprocessing stack and Needle Engine's postprocessing stack differs, some experimentation may be needed to get the right runtime look. You can add the (experimental) Editor Sync component to your scene root for even faster iteration.  

### Ambient Occlusion

Screen Space Ambient Occlusion can be added as a component to your camera to enable this at runtime. This does not match to Unity's SSAO renderer feature due to incompatible settings. 

## Limitations

Exporting post processing effects is currently only supported in URP. You can still use them from BiRP at runtime, but you need to set them up in code. 

To see post processing effects inside Unity, make sure post processing is enabled both on the camera and the URP asset. Also, make sure post processing is enabled in the scene view.