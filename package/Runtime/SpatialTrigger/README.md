# Spatial Trigger

With spatial triggers, you can get notified when objects enter a box volume. 

You can find a use for such a system in multiple use cases, such as:
- Opening and closing doors in your virtual conference environment without the need to press a key. 
- Turning on and off lights in your arch viz. 
- Spawning enemies in your game when you enter a specific part of your level.

## Usage

### Create a trigger

- Create a new game object and add the `SpatialTrigger` component. 
- Choose a layer that the trigger will react to.

Currently, the size can be driven only with a mesh on the spatial trigger. Otherwise, it is 1,1,1 box.
Mind a limitation that the spatial trigger doesn't support rotation.

### Create a receiver

- To your player, add the `SpatialTriggerReciever` component.
- Choose a layer that the receiver should interact with.
- Finally, hook your OnEnter, OnStay and OnExit events based on your concept.

## Note
For more complex collision detection with more complex shapes, please use rigidbodies with [onCollisionEnter or onTriggerEnter](https://engine.needle.tools/docs/scripting.html#component-architecture)
