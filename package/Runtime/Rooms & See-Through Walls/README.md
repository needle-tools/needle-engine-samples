# See-through Walls and Objects

This example demonstrates how to create a see-through effect for walls and objects in a 3D scene using Needle Engine. The effect is achieved by fading out objects that obstruct the view towards a specified center point, such as a camera or player position.

The `SeeThroughFade` component is attached to the objects that should fade out when they obstruct the view. The component uses the material's alpha property to create a smooth transition effect (it supports both alphaHash and transparent blend modes).