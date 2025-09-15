# Collaborative Sandbox

## Drag Controls and Object Cloning

Two components are used in this sample scene to enable moving objects by drag (across all platforms) and duplication of items. 
These are `DragControls` and `Duplicatable`. Together, they allow building sandbox-style applications, where users can choose from predefined parts and arrange them to larger scenes.  

## AR and VR

The scene is ready for AR and VR utilizing the `WebXR` component with various settings for scene scale and positioning, movement and teleportation.

## Networking

The scene supports networking across all web platforms (including AR and VR).  

`SyncedTransform` automatically takes care of synchronizing the position and rotation of objects across all clients. `DragControls` also handles ownership – that is, when someone starts dragging an object they get ownership of the object and its position and rotation.  

This allows for collaborative editing and building of playful scenes.  
