# Physics

Use Rigidbody and Collider components to make objects physical and collide with each other - without writing a single line of code.     

Needle Engine supports Box-, Sphere-, Capsule- and Meshcolliders, gravity and drag settings as well as physics materials to control friction and bounciness.    

If you need more control you can use the built-in event functions to react to collision or trigger events or interact with the underlying physics engine (Rapier) directly.

## Joints

`HingeJoint`: A hinge which can rotate only on one axis in a allowed angle range (used for doors, chains or pendulums)

`FixedJoint`: A hinge that is used to mimic a fixed connection e.g. this can be used when you can't parent objects under one another