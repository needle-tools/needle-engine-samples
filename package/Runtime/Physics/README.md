# Physics

## Intro

Unity utilizes Nvidia's PhysiX engine while Needle utilizes [Rapier](https://rapier.rs/).

But all you need to know is [the list of supported components](https://engine.needle.tools/docs/component-reference.html#physics) that work right out of the box.

---

## Basics

Physics in unity is comprised of two elements. The Rigidbody and the Collider where the rigidbody is the logic and the collider is the shape.

Adding a rigidbody to an object without a collider will result in an object that is endlessly falling since gravity is applied to it. By adding a collider the object can finally collide with the ground and stop falling.

Note that colliders can be in the children of an object that has a rigidbody and not only on the same game object.

## Raycasting

Raycasting is fundamentally like emitting a laser with limited length, and if the laser touches something, we get that object as a result.

For more information visit [the documentation](https://engine.needle.tools/docs/getting-started/for-unity-developers.html#raycasting).
