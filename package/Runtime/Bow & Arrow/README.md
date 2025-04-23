# Bow & Arrow Sample

This sample demonstrates a simple bow and arrow minigame, showcasing physics, XR interactions, particle effects, and basic game logic within Needle Engine.

It leverages Needle Engine's ability to seamlessly translate Unity workflows, like physics and animation, directly to the web, making XR development remarkably straightforward.

## Key Features

*   **Simple XR Interaction:** Demonstrates attaching objects (`Bow`) to XR controllers using `XRControllerFollow` for natural aiming and interaction.
*   **Physics-Based Gameplay:** Utilizes familiar Unity physics components (`Rigidbody`, `SphereCollider`, `BoxCollider`) directly exported for realistic arrow flight and collision detection. No complex web physics setup required!
*   **Custom TypeScript Logic:**
    *   `ArrowShooting`: Manages drawing the bow, calculating shot power based on draw distance (using an Animation Curve), and spawning arrow prefabs.
    *   `Arrow`: Controls the projectile's behaviour after being shot, including collision detection and triggering effects.
    *   `BowArrowTarget`: Defines target behaviour, reacting to hits from arrows with particle effects and sounds.
    *   `BowTargetSpawner`: Handles the spawning and management of different target prefabs (`Sphere`, `Cube`).
*   **Visual & Audio Feedback:** Integrates `ParticleSystem` and `AudioSource` components for effects upon hitting targets and shooting the bow.
*   **Animation Integration:** Uses Unity's Animation system, driven by script (`ArrowShooting`), to visualize the bow being drawn.

## How it Works

1.  The `Bow` GameObject uses the `XRControllerFollow` component to attach itself to the player's specified hand (default: right hand in grip space) in XR.
2.  The `ArrowShooting` component on the `Bow` manages the shooting logic. It detects the distance between the bow hand and the other hand (implicitly, the arrow nocking hand).
3.  As the player draws the "arrow" back (increases the distance between hands), the `ArrowShooting` script:
    *   Updates the bow's `Animation` component based on the draw distance.
    *   Calculates the shot power using the configured `power` multiplier and the `drawProgression` Animation Curve.
4.  Upon "release" (typically when the distance decreases or a button is released, though the exact trigger isn't detailed in the script here, it's implied interaction), `ArrowShooting`:
    *   Instantiates the `Arrow` prefab at the `arrowSpawnSpot` Transform.
    *   Applies force to the arrow's `Rigidbody` based on the calculated power.
    *   Plays a shooting sound via the assigned `AudioSource`.
5.  The instantiated `Arrow` GameObject has:
    *   A `Rigidbody` for physics simulation.
    *   A `SphereCollider` for collision detection.
    *   An `Arrow` script that listens for collisions.
6.  When the `Arrow` collides with an object tagged appropriately (likely handled implicitly by checking for `BowArrowTarget`), the `Arrow` script triggers the `audioOnImpact` `AudioSource`.
7.  GameObjects like `Sphere` and `Cube` act as targets. They have:
    *   A `Rigidbody` and a Collider (`SphereCollider` or `BoxCollider`).
    *   A `BowArrowTarget` component, which references a `ParticleSystem` (`HitParticles`) to play upon being hit. The target might also destroy itself depending on the `Arrow` script's settings.
    *   A `RandomColor` script to add visual variety.
8.  The `BowTargetSpawner` manages the lifecycle of targets, likely spawning new ones periodically or after they are destroyed.

## Running the Sample

This sample can be installed directly from the Needle Engine Samples window in Unity (`Needle Engine > Explore Samples`).  
Alternatively, download the `.unitypackage` from [samples.needle.tools](https://samples.needle.tools/) and import it into your project.

1.  Open the scene in Unity from the Needle Engine Samples window `Needle Engine/Explore Samples`.
2.  Press Play in Unity
3.  **For XR Interaction:** Ensure you have a VR headset connected and configured (e.g., via SteamVR, Oculus Link, or directly if using Quest Browser). Enter VR/AR mode using the button provided by the `WebXR` component. Use your controllers to grab and shoot the bow.

## Customization Ideas

*   Implement a scoring system based on hitting targets.
*   Create different types of targets with varying behaviours or point values.
*   Add more complex environment interactions.
*   Refine the arrow physics (e.g., add drag based on velocity).

## Deployment

Deploy your project easily to the web using Needle Engine's integrated deployment options. Deploying via [Needle Cloud](https://cloud.needle.tools/) is often the quickest way to get your project online and shareable. Find deployment options in the `Needle Engine` component in your scene.

## Support

For questions and feedback, visit the [Needle Engine Forum](https://forum.needle.tools) or join the [Needle Discord](https://discord.needle.tools).  Check out the [Needle Engine Documentation](https://engine.needle.tools/docs) for more information.

## Credits
Model by https://sketchfab.com/3d-models/10-bows-and-cross-bows-1774a072f1cd45bf9c0875c1a23919a7 
