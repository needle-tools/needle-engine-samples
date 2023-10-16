# XR Mesh Detection

The room mesh can be accessed and displayed on Quest 3 devices and other devices implementing WebXR Plane Detection or Mesh Detection. 

A custom object with one or more materials can be supplied as template mesh. This allows to add custom scripts, collision, shaders to the tracked mesh.

Mesh Tracking is supported on Quest 3 devices.  
Plane Tracking is also supported on most Android devices that support WebXR, as well as Quest 2 / Quest Pro. 

## Usage

On the WebXR component, select WebXRPlaneTracking. There you can set options regarding the detection type (planes, meshes, or both) and whether a room capture should be initiated if no data is found in the first few seconds.