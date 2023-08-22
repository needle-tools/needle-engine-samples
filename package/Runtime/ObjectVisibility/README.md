# Object Visibility

This sample shows how to disable objects with their children, single scripts or how to disable just rendering for single objects (without affecting children)

Setting `gameobject.visible` to `false` will hide the GameObject, it's children and also set the component being used to inactive. It is also possible to only disable rendering of single objects without affecting children by setting `Renderer.enabled` to false.  

For example: 
```
const renderer = this.gameObject.getComponent(Renderer); 
if(renderer) renderer.enabled = false; // < disable rendering for a single object only
```

## API

### Gameobjects / Object3D
Gameobjects have a `visible` boolean which drives the active state - setting `visible` to false also disables (or enables) the child hierarchy.

### Components
Components have an `enabled` boolean which turns on and off their internal logic. If you are writing your own behaviour script (a component when deriving from the Needle Engine `Behaviour` base class), then the enabled state drives the execution of the built-in events such as awake, start, update and many more.
