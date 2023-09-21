# First Person Controller

This sample demonstrates a number of techniques:
- custom character and camera controls
- physical interactions between characters and the world
- touch controls
- Gamepad input

## Multiplayer

The multiplayer sample demonstrates the `PlayerSync` component and how it can be leveraged to spawn a player prefab for many people in the same room. The prefabs themselves handle how they are networked – in this case, using `SycnedTransform`.

- basic networking
- spawning objects for each user in a room
- ownership handling (each user should only control their own character)