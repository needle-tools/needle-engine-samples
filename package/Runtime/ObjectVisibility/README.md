# Object Visibility

Needle borrows the structure of gameobjects and components from Unity. Both can be activated and deactivated individually, but the hosting gameobjects also affect its components and children's gameobjects.

Disabling a gameobject will result both in disabling rendering, but also your custom scripts or physics. If you wish to disable only rendering, it is recommended to just disable the Renderer component.

## API

### Gameobjects / Object3D
Gameobjects have a `visible` boolean which drives the active state. While the property is called "visible", it doesn't only drive rendering. 

Alternatively, there's a helper function that resembles more of Unity API `GameObject.setActive(obj, state)`.

### Components
Components have an `enabled` boolean which turns on and off their internal logic. If you are writing your own behaviour script (which is defacto a component), then the enabled state allows for the execution of the built-in events such as awake, start, update and many more.