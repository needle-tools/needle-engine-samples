# Collaborative Sandbox

## Drag Controls and Duplication

Two components are used in this sample scene to enable moving objects by drag (across all platforms) and duplication of items. 
These are `DragControls` and `Duplicatable`. Together, they allow building sandbox-style applications, where users can choose from predefined parts and arrange them to larger scenes.  

## Networking

The scene supports networking across all web platforms.  
`SyncedTransform` automatically takes care of synchronizing the position and rotation of objects across all clients. `DragControls` also handles ownership – that is, when someone starts dragging an object they get ownership of the object and its position and rotation.  

This allows for collaborative editing and reviewing of scenes.  

## AR and VR

The scene also contains core components for full AR and VR support. 
`XRRig` defines the player start position in VR.  
`ARSessionRoot` specifies how big and where a scene is placed in AR.  
VR scenes are often presented at 1:1 scale, while AR scenes are typically shrinked down to fit on a table.  
`SyncedRoom` takes care of setting up connections between players and provides a new random room URL on startup.  

# Deployment

The root object contains a `DeployToGlitch` component. Click on `Create new` and follow the instructions to set up your own collaborative sandbox.  