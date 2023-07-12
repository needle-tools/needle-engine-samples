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

Currently, the size can be driven with a mesh on the spatial trigger. Otherwise, it is a 1,1,1 box, but you can scale the object to fit your preferred dimensions.
While also mind a limitation that the spatial trigger doesn't support rotation and has to be world aligned.

### Create a receiver

- To your player, add the `SpatialTriggerReciever` component.
- Choose a layer that the receiver should interact with.
- Finally, hook your OnEnter, OnStay and OnExit events based on your concept.

## Note
When you are using Physics in your project or are dealing with more more complex shapes you can also use rigidbodies with [onTriggerEnter/onTriggerStay/onTriggerExit](https://engine.needle.tools/docs/scripting.html#component-architecture)
