# Bow & Arrow

A VR minigame showcasing physics, XR interactions, particle effects, and game logic. Grab the bow, draw the string, and shoot targets!

## Key Features

- **XR Controller Interaction** — The bow attaches to your hand via `XRControllerFollow` for natural aiming
- **Physics-Based Arrows** — `Rigidbody` and colliders handle realistic arrow flight and collision
- **Draw Mechanics** — Shot power is calculated from the distance between your hands, with an Animation Curve controlling draw progression
- **Target System** — Spawned targets react to arrow hits with particle effects and sound
- **Cross-Platform** — Works on desktop, mobile, and VR

## Custom Scripts

- `ArrowShooting` — Manages draw distance, power calculation, and arrow spawning
- `Arrow` — Handles projectile behavior and collision events
- `BowArrowTarget` — Target hit reactions with particles and audio
- `BowTargetSpawner` — Manages target lifecycle and spawning

## Customization Ideas

- Add a scoring system based on target hits
- Create different target types with varying point values
- Refine arrow physics with drag or trajectory trails
- Add environmental hazards or moving targets

## Credits

[Bow model](https://sketchfab.com/3d-models/10-bows-and-cross-bows-1774a072f1cd45bf9c0875c1a23919a7)
