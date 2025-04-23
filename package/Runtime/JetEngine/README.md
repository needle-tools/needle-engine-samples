# Jet Engine Sample

## Description

This sample demonstrates how to create an interactive 3D product showcase for the web using Needle Engine. It showcases how Needle Engine streamlines the process of bringing complex, animated 3D models from Unity into performant web experiences, complete with interactive UI elements and built-in Augmented Reality (AR) export capabilities for platforms like iOS.

Needle Engine handles the complexities of web export, optimization, and interactivity setup, allowing creators to focus on building engaging 3D presentations. This sample features interactive hotspots, smooth camera controls, model animations, and dynamic UI elements, all configured within the familiar Unity environment.

## Key Features

*   **Interactive Hotspots:** Clickable areas on the model trigger information panels and animations.
*   **Smooth Camera Controls:** User-controlled orbiting camera powered by `OrbitControls`.
*   **Complex Model Animations:** The jet engine features animations controlled via Unity's `Animator` component.
*   **Dynamic UI:** Screenspace UI elements (panels, navigation dots) change based on user interaction, driven by the `EverywhereConfigurator`.
*   **Seamless AR Experience:** Includes configuration for exporting to USDZ with interactive elements (`Everywhere Actions`), enabling native AR viewing on iOS devices via Quick Look. `WebXR` support is also included for broader compatibility.
*   **Audio Feedback:** Subtle audio cues enhance the interactive experience (`AudioSource`).
*   **Efficient Deployment:** Easily deployable to the web, including one-click deployment via `https://cloud.needle.tools`.

## How it Works

This sample utilizes several key Needle Engine components and concepts:

1.  **Core Model & Animation:** The jet engine model (`Turbine` GameObject) uses a Unity `Animator` component to drive its animations (e.g., spinning). An `AudioSource` is attached for sound effects.
2.  **Interaction Logic (`EverywhereConfigurator`):**
    *   **Main State Management:** An `EverywhereConfigurator` component on the `Configurator` GameObject manages the main states of the showcase. It links trigger Transforms (the navigation dots in the UI and invisible hitboxes) to content Transforms (different UI panels, category highlights, and potentially different states/visibilities of the main model). When a trigger is activated (clicked), its corresponding content is shown, and others are hidden.
    *   **Hotspot Effects:** A second `EverywhereConfigurator` on the `Hotspots` GameObject handles the visual feedback for the interactive hotspots placed on the engine model. It likely manages showing/hiding hover and active states for these hotspots.
3.  **Hotspots (`SetActiveOnClick`):** Individual hotspots (e.g., `Hotspot 1`, `Hotspot 2`) use the `SetActiveOnClick` component. This simple component, compatible with `Everywhere Actions`, allows these hotspots to trigger changes even within the exported USDZ file for iOS AR.
4.  **UI Elements (`SpriteRenderer`):** The UI panels, category titles, and navigation dots are primarily built using GameObjects with `SpriteRenderer` components. Their visibility is controlled by the main `EverywhereConfigurator`.
5.  **Camera:**
    *   `OrbitControls`: Allows users to freely rotate and zoom the camera around the jet engine.
    *   `LookAtConstraint`: Ensures the camera always points towards the `Camera LookAt Goal` GameObject, keeping the engine centered.
6.  **AR / USDZ Export:**
    *   `USDZExporter`: Configured on the `WebXR` GameObject, this component enables the creation of a `.usdz` file for iOS AR Quick Look.
    *   `Everywhere Actions`: Components like `SetActiveOnClick` are designed to be compatible with this system, allowing simple interactions to function within the exported USDZ.
    *   `WebXR`: Provides the foundation for broader WebXR support (AR/VR) on compatible devices and browsers.
7.  **Optimization & Visuals:** Components like `ContactShadows` and `ToneMappingEffect` enhance visual quality while remaining performant on the web.

## Getting Started

To run this sample in the Unity Editor:

1.  **Install:**
    *   In the Unity Editor, go to `Needle Engine > Explore Samples` and install the "Jet Engine" sample.
    *   *Alternatively*, download the `.unitypackage` from [https://samples.needle.tools](https://samples.needle.tools) and import it into your Unity project (`Assets > Import Package > Custom Package...`).
2.  **Open Scene:** via Needle Engine samples window (`Needle Engine/Explore Samples`)
3.  **Run:** Press **Play** in the Unity Editor. The sample will automatically start a local web server and open in your default browser.

## Deployment

Needle Engine projects are standard web projects and can be deployed to any static web hosting service.

1.  **Build:** To create an optimized build simply click Build to disc in the Needle Engine Build window
2.  **Deploy:**
    *   **Easy Deployment:** In the Unity scene, select the `Export` GameObject. In the Inspector, find the `Export Info` component and click the **Deploy to Needle Cloud** button for instant hosting provided by Needle.
    *   **Manual Deployment:** Upload the contents of the `dist` folder (created by the build step) to your preferred hosting provider (e.g., Netlify, Vercel, GitHub Pages, FTP).

Find more details in the [Deployment Documentation](https://engine.needle.tools/docs/deployment).

## Customization Ideas

*   **Replace Model:** Swap the jet engine with your own 3D product model. Adjust hotspot positions and update the UI panels with relevant information.
*   **Modify UI:** Change the sprites used for UI panels, titles, and navigation elements to match your product's branding or desired aesthetic.
*   **Add More Detail:** Enhance the information panels triggered by hotspots. Include more detailed text descriptions, specifications, additional images, or even embed short videos using Needle Engine's `VideoPlayer` component.
*   **Expand Interactions:** Implement more complex interactions using custom TypeScript components. For example, trigger unique animations or sound effects specific to each hotspot, or allow users to cycle through different model variations or materials.
*   **Integrate Advanced Features:** Explore adding features like multiplayer viewing using `SyncedRoom`, physics interactions with `Rigidbody`, or more sophisticated animations controlled via Unity's Timeline.

## Support

*   **Documentation:** [engine.needle.tools/docs](https://engine.needle.tools/docs/)
*   **Discord:** Join the community at [discord.needle.tools](https://discord.needle.tools/)
*   **Forum:** Find help and discussions at [forum.needle.tools](https://forum.needle.tools/)
