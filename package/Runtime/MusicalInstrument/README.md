# Musical Instrument

The sample is built using Needle Engine [Everywhere Actions](https://engine.needle.tools/docs/everywhere-actions.html) - a set of carefully chosen components that allow you to create interactive experiences in Unity without writing a single line of code.
They are designed to serve as building blocks for experiences across the web, mobile and XR, including Augmented Reality on iOS.

## Key Features

*   **Interactive Playback:** Users can click or tap on individual parts of the 3D musical instrument model.
*   **Synchronized Audio & Animation:** Each interaction simultaneously triggers a specific sound effect using `AudioSource` and a corresponding visual animation via the `Animator`.
*   **Component-Driven Interaction:** The core interactivity is achieved using built-in components like `PlayAudioOnClick` and `PlayAnimationOnClick`, configured directly in the Unity editor.
*   **Everywhere Actions & USDZ Export:** The scene utilizes the `WebXR` component, configured to package the 3D model, materials, *and* the click-driven audio/animation behaviors into a single, interactive `.usdz` file compatible with AR Quick Look on iOS.
*   **Cross-Platform Web Deployment:** Built entirely on web standards, the experience runs efficiently in modern desktop and mobile browsers.
*   **WebXR Ready:** Includes standard `WebXR` support via the `WebXR` component and `XRRig` GameObject for viewing in VR headsets or engaging in web-based AR placement on compatible devices.

## Customization Ideas

*   **Swap the Model:** Replace the default instrument with your own 3D model. Remember to segment interactive parts into separate GameObjects.
*   **Customize Sounds/Animations:** Assign your own `AudioClip` assets in the `PlayAudioOnClick` components and modify or create new `AnimationClips` for the `PlayAnimationOnClick` components.
*   **Expand the Instrument:** Add more playable parts to your model, each configured with its own audio and animation components.
*   **Introduce Visual Effects:** Trigger `ParticleSystem` effects upon interaction for added visual feedback, potentially using Timeline signals or simple scripts.
*   **Develop Complex Logic:** While this sample is code-free, you could add TypeScript components to introduce more complex behaviors, like sequencing, dynamic sound changes, or interactions between parts.

## More Information

*   **Needle Engine Documentation:** [engine.needle.tools/docs](https://engine.needle.tools/docs/)
*   **Needle Engine Forum:** [forum.needle.tools](https://forum.needle.tools/)
*   **Needle Engine Website:** [needle.tools](https://needle.tools/)
