# Musical Instrument

## Description

This sample demonstrates how Needle Engine empowers creators to build interactive 3D experiences for the web featuring synchronized audio and animation playback triggered by user input. It highlights the efficiency of a component-based workflow within Unity, allowing for the setup of engaging interactions like playing a virtual instrument **without writing custom code**. A key strength showcased is Needle Engine's seamless integration with USDZ and its Everywhere Actions capabilities, enabling these rich interactions to be directly exported for immersive Augmented Reality experiences on iOS devices, accessible instantly via Quick Look.

## Key Features

*   **Interactive Playback:** Users can click or tap on individual parts of the 3D musical instrument model.
*   **Synchronized Audio & Animation:** Each interaction simultaneously triggers a specific sound effect using `AudioSource` and a corresponding visual animation via the `Animator`.
*   **Component-Driven Interaction:** The core interactivity is achieved using built-in components like `PlayAudioOnClick` and `PlayAnimationOnClick`, configured directly in the Unity editor.
*   **Everywhere Actions & USDZ Export:** The scene utilizes the `WebXR` component, configured to package the 3D model, materials, *and* the click-driven audio/animation behaviors into a single, interactive `.usdz` file compatible with AR Quick Look on iOS.
*   **Cross-Platform Web Deployment:** Built entirely on web standards, the experience runs efficiently in modern desktop and mobile browsers.
*   **WebXR Ready:** Includes standard `WebXR` support via the `WebXR` component and `XRRig` GameObject for viewing in VR headsets or engaging in web-based AR placement on compatible devices.

## How it Works

The scene contains a 3D model of a musical instrument, with its parts rendered by `MeshRenderer` components. Essential scene elements like a `Camera` (equipped with `OrbitControls` for navigation and a `LookAtConstraint` focusing on a central point), a `Directional Light`, and an `AudioListener` are included.

The interaction logic is defined as follows:

1.  The `ObjectRaycaster` component is present to detect pointer events (like clicks or taps) on rendered scene objects.
2.  Each interactive element of the instrument model (e.g., a key, pad) has a `Collider` attached to define its clickable surface.
3.  The `PlayAudioOnClick` component is added to each interactive element. It's configured with an `AudioClip` and targets an `AudioSource` to play the sound when clicked.
4.  Similarly, the `PlayAnimationOnClick` component is added to trigger a specific animation state or clip on the element's `Animator` component upon interaction, providing visual feedback.
5.  The `USDZExporter` component on the `MusicalInstrument` GameObject has its `interactive` flag enabled. This ensures that the behaviors defined by `PlayAudioOnClick` and `PlayAnimationOnClick` are embedded within the exported `.usdz` file, making the AR experience interactive on iOS.
6.  The `WebXR` component and `XRRig` GameObject provide the standard setup for enabling VR and AR sessions directly within the web browser.

## Running the Sample

1.  Ensure you have Needle Engine installed in your Unity project.
2.  Install the sample via the `Needle Engine/Explore Samples` menu in the Unity Editor, or by downloading and importing the sample's `.unitypackage` from [samples.needle.tools](https://samples.needle.tools).
3.  Open the `MusicalInstrument` scene via the `Explore Samples` window.
4.  Press the Play button in the Unity Editor.
5.  Needle Engine will build the project for the web and start a local development server. Your default web browser should automatically open, loading the interactive musical instrument experience.
6.  You can also use the QR Code displayed in the Game view (enabled by the `NeedleMenu` component) to easily test the sample on a mobile device connected to the same network.

## Deployment

Deploying your project is straightforward. The `Needle Engine` component, located on the `Export Info` GameObject in the scene, offers various build and deployment options. You can use the integrated one-click deployment feature to publish your project directly to [Needle Cloud](https://cloud.needle.tools) for easy sharing and testing. Alternatively, build the project locally and upload the contents of the generated web export folder to any standard static web hosting provider (like Netlify, Vercel, GitHub Pages, FTP, etc.).

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
