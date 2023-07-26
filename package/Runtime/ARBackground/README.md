# AR Camera Background

This sample demonstrates access to the camera image in an AR session. Typically this is used for recording the full screen, distortion effects, projection mapping, or computer vision cases. 

An additional optional WebXR session feature is requested at session creation time: `camera-access`. On most devices this also requires the user to grant additional permissions to use the camera. 

The background tinting feature is provided as an example; duplicating the ARCameraBackground script allows modifying the shader, using different rendering techniques, and so on. 

## Limitations

Camera image access is not supported on Meta Quest devices (not even for native apps). 