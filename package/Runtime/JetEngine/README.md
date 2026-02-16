# Jet Engine

An interactive 3D product showcase featuring a detailed jet engine model with hotspots, animations, and camera controls — all set up without code using built-in Needle Engine components.

## Key Features

- **Interactive Hotspots** — Clickable areas on the model reveal information panels and trigger animations
- **Camera Controls** — Smooth orbiting camera with `OrbitControls` and `LookAtConstraint`
- **Animator-driven Animation** — The engine spins and reacts using Unity's Animator
- **Screenspace UI** — Navigation dots and info panels built with `SpriteRenderer` components, managed by `EverywhereConfigurator`
- **iOS AR Export** — Automatic USDZ conversion with interactive `Everywhere Actions` for AR Quick Look
- **Contact Shadows & Tone Mapping** — Polished visuals using built-in rendering components

## How it Works

The `EverywhereConfigurator` component manages the showcase states — linking navigation triggers to content panels. Each hotspot uses `SetActiveOnClick`, which also works inside exported USDZ files for iOS AR. The same components drive both the web experience and the AR export.

## Customization Ideas

- Swap the jet engine for your own product model and reposition the hotspots
- Update the UI panels with your product's branding and information
- Add more hotspot states or embed videos using `VideoPlayer`
- Extend with multiplayer viewing using `SyncedRoom`
