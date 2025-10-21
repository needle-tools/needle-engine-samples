# Changelog
All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [1.3.2] - 2025-10-21
- Improve AnimatedMaterials and AnimatedProperties sample scenes
- Cleanup Splines sample

## [1.3.1] - 2025-10-16
- Add: Splines + Scroll sample

## [1.3.0] - 2025-10-15
- Add: Droplistener sample
- Add: See-Through sample
- Change: Simplified Hotspot sample does not use `Hotspot Template` anymore. Instead all hotspots are prefabs in the scene. The hotspot script does now also set a view point using OrbitControls.

## [1.2.1] - 2025-10-08
- Add: Bike Scrollytelling Sample asset
- Update component documentation links
- Update Needle Engine Unity Plugin dependency to 4.10.4

## [1.2.0] - 2025-09-15
- **NEW** Look At Cursor example

## [1.1.2] - 2025-09-10
- **NEW** Scrollytelling example
- Update CarPhysics example

## [1.0.1] - 2025-08-18
- Update Needle Engine Unity Plugin dependency to 4.8.3

## [1.0.0] - 2025-08-14
- Change: Face Filter sample is now installed via NPM
- Update Needle Engine Unity Plugin dependency to 4.8.1

## [0.20.1] - 2025-02-19
- Deploy samples to Needle Cloud
- Update Diamond Ring / Jewelry sample: fixing diamon shader regression for iOS 18.3 (issue FB16525288)
- Update Car Physics sample: adding gamepad controller support and music
- Update VRM sample
- Update Bow & Arrow sample
- Update Voxel editor sample
- Update Spatial Audio sample
- Update DeviceDetection sample
- Update MX ink sample scenes
- Update DepthSensing sample
- Update Mesh tracking sample

## [0.20.0] - 2025-02-13
- Update Needle Engine dependency

## [0.20.0-pre] - 2025-02-05
- Add: GalleryPoi now saves the last activated POI in a query parameter
- Update Car Physics and particles samples
- Update Needle Engine dependency

## [0.20.0-exp.2] - 2025-01-31
- Updated various sample scenes for latest Needle Engine 4.1 beta

## [0.20.0-exp.1] - 2025-01-17
### Fixed
- MaterialX material file references in scene

## [0.20.0-exp] - 2025-01-14
- Update Needle Engine to 4.1.0-alpha.7

## [0.19.8-pre] - 2024-10-01
### Fixed
- FaceFilter: order tracked faces

## [0.19.7-pre] - 2024-09-30
### Added
- FaceFilter support for tracking multiple faces

### Changed
- Bump Needle Engine dependency to 3.48.3

## [0.19.6-pre] - 2024-09-23
### Added
- ShaderToy Face Filter example scene

### Fixed
- Face Filter now automatically load the best LOD level (if mesh or texture lods are enabled)

### Changed
- Needle Engine Samples AssemblyDefinition file is now set to auto referenced which means that generated code will be able to reference sample scripts without having to setup a AssemblyDefintion manually.

## [0.19.5-pre] - 2024-09-19
### Added
- MX Ink Pen and Sword sample
- Brush and color palette to LineDrawing sample
- Gyroscope button to PanoramaControls
- Store used components per sample in SampleInfo

### Fixed
- Gyroscope and PanormaControls correctly use Z rotation (tilt)
- Camera following CharacterController on Z axis
- Pencil Sword sample's particles and camera driving

### Changed
- PanoramaControls panorama
- Improved PanoramaControls dragging

## [0.19.4-pre] - 2024-09-11
### Added
- Crocodile and alien face mask
- Experimental shader toy face mask filter

## [0.19.3-pre.1] - 2024-09-10
### Added
- Face Mesh support: Add a `FaceMeshTexture` or `FaceMeshVideo` component to your GameObject and add the object to the filters list in the FaceFilterTrackingManager component.

## [0.19.2-pre] - 2024-09-06
### Added
- Face Filters now support custom logo/branding in videos for Needle Engine PRO license holders

## [0.19.1-pre] - 2024-09-04
### Added
- Add: Face Filters now support playback of recorded videos for development

## [0.19.0-pre] - 2024-09-03
### Added
- Movie Set sample
- Face Filter sample. Create your own filters with Needle Engine and Unity. The sample includes 6 example filters

### Fixed
- SplineWalker `clamp` did not clamp the progress at 1

## [0.18.0] - 2024-09-02
### Added
- Realtime Clock sample
- DeviceDetection: uses isMacOS
- CarPhysics: Touch Controls, improve Wheel Physics and Debug Gizmos
- ContactShadows: WebXR support
- JetEngine: Hotspots and USDZ support
- Splines: linear mode support 
- GalleryManager and GalleryPOI classes
- Particles and AnimatedMaterials samples using GalleryManager
- SyncedPlayableDirector sample script

### Removed
- ThreeTonemapping component and replaced with the core ToneMappingEffect component
- Scripting Snippets sample

### Fixed
- scene scales are 1:1 to real life when using WebXR
- SwitchableWalls interactions in AR
- Scrollytelling ignoring touch
- EverywhereConfigurator's default variant handling

### Changed
- standardize UI labels in the majority of samples
- synchronize tags for USDZ, iOS and EverywhereActions samples
- rename Scripting Snippets to Realtime Clock
- rename USDZ Product to USDZ Configurator
- rename samples that use EverywhereActions
- disable SpatialGrabRaycaster in ShootingRange

## [0.17.2] - 2024-06-25
- add RequirePackage component to install unity package dependencies right from the sample scene
- fix Bow & Arrow audio issues

## [0.17.1] - 2024-06-24
- bump engine dependency to 3.41.1-exp

## [0.17.0] - 2024-06-19
- add Jet Engine sample
- add Body Tracking sample
- add Car Physics sample
- add Contact Shadows sample
- add "Deploy To" samples: FTP, Github Pages, Glitch and Itch 
- add Material X sample
- add Multiple Cameras sample
- add Panorama Controls sample
- add Recorded Avatars sample
- add Snow Globe sample
- add Splines sample
- add Summoning Animation sample
- add USDZ Animator sample
- add VRM Character loading sample
- add Device Detection
- update Particles sample, improving general gallery controls
- update Video Playback, adding livestream showcase
- update Reflection Probes sample
- add ThreeTonemapping component
- enable "Create QR Code Button" for all samples
- update Needle Engine dependency to 3.40.0-exp.1
- add Draco, KTX and Meshopt packages as dependencies for compressed model importing support
- update tests to be more lenient on video and audio files when checking sample size

## [0.16.0] - 2024-04-12
- add NeedleMenu component to all samples
- add Progressive Loading settings to relevant samples
- add HTML Meta to all samples that were missing it
- add pointer controls to Bow & Arrow
- add VR support for CameraGoal (used in LOD sample)
- add music to Multi Scenes sample
- add music to Product Flyover
- fix Hotspot editor multi-editing
- fix LineDrawer creating long segments when turning with a VR controller stick
- fix incorrect vertical position in some cases for NavMesh agents sample
- fix DeviceSensor gyroscope sample to be more easily driven externally
- update test for checking outdated deployments (compared to latest stable)
- updated some skybox assets to EXR
- update Multiple Lightmaps sample with the website house model
- update Needle Engine to `3.36.6`

## [0.15.0] - 2024-02-19
- add Bow & Arrow sample
- add Navmesh sample
- fix DeviceSensor gyroscope control to work in all screen orientations and devices
- replace old UI sprites in the Hotspot sample 
- improve gun input in the Shooting range sample
- add USDZ Color Menu sample

## [0.14.0] - 2024-01-30
- add Depth Sensing sample
- add Transmission sample
- update all XR samples (webxr2)
- update Physics samples visuals
- add DeployToFTP/GithubPages/Glitch samples
- improve Device Sensor (Gyroscope) to support different device orientation
- add external sound loading to the External Content sample
- fix hotspot view angle in XR
- add controls to the Lightmaps sample
- add animation to loading scene in Multi Scenes sample
- add Scrollytelling slider control variant 
- add trails inheriting velocity 
- improve Vue sample

## [0.13.0] - 2023-11-06
- fixes to FirstPersonController, Hotspots, Multi-Scenes, Networking, Stencil Portals, UI, sample scripts
- update required Unity version to 2021.3.9f1
- update Needle Engine to `3.22.6`

## [0.12.0] - 2023-10-16
- add Gaussian Splatting sample
- add XR Mesh Tracking sample (e.g. on Quest 3)
- add Worldspace UI sample
- add mobile controls to Shooting Range sample
- update Needle Engine to `3.20.1`

## [0.11.0] - 2023-10-10
- add Shooting Range sample
- add Javascript Communication sample
- add Level of detail (LOD) sample
- add Product Flyover sample
- add React sample
- add Networking Room data - unreleased sample
- add First Person Controller - Single Player
- add HTML touch controls to First Person Controller samples
- add Diamond Ring sample
- change UIButton sample to Worldspace UI sample
- update Multi-Scene content
- update sample tags
- update Needle Engine to `3.19.8`

## [0.10.0] - 2023-09-11
- add Digital Landscape sample
- add React sample
- update FirstPersonController samples
- update Scrollytelling sample
- improve Lightmap sample

## [0.9.0] - 2023-08-28
- add Framerate sample
- add Line Drawing sample
- add Networked Animator sample
- add HTML Pen Data sample (Pencil Sword)
- add Voxel Editor sample (Everywhere Actions)
- update Networking Player sample with lifecycle events
- update USDZProduct sample
- update Svelte and SvelteKit samples
- update Portrait Painting sample
- clean up Character Controller sample
- clean up transparent video sample shader
- update Needle Engine to `3.12.0-pre.2`

## [0.8.1] - 2023-07-28
- update Needle Engine to `3.10.7-pre`

## [0.8.0] - 2023-07-28
- add AR Camera Background sample
- add Switchable Walls sample
- add Media Pipe sample
- add Multi Lightmaps sample
- add Next.js sample
- add Svelte sample
- add Texture Details sample
- add Networking samples
- add Everywhere Configurator sample
- add First-Person Character Controller sample
- add Readme's for all samples
- update Animated Properties and Animated Materials samples
- update Hotspots sample with cross-platform support
- update Looking Glass and Presence Platform samples
- update Tags for samples

## [0.7.0] - 2023-05-10
- add USDZ Interactivity / Characters samples
- add Configurator sample
- add Image Tracking sample
- add Musical Instrument sample
- add room tracking/passthrough sample
- add External Content sample
- add Interactive Map sample
- add Netlify Deployment sample
- add Portal rendering sample
- update Video Playback sample

## [0.6.0] - 2023-04-11
- add PostProcessing sample
- add Sidescroller sample
- add Vue.js sample
- add Hotspots sample
- add Multi-Scene sample

## [0.5.1] - 2023-03-14
- add new GroundProjection sample
- fix script import paths for `2.65.2`
- fix iframe click not being received sometimes

## [0.5.0] - 2023-03-03
- fixed some sample materials not properly updating in 2021.3 and 2022.1
- fixed screensharing sample having a broken Prefab reference
- fixed Web Projects missing for HTML sample and Scrollytelling sample
- added camera fitting and other improvements to Looking Glass sample and loader
- added particle collision sample

## [0.4.0] - 2022-12-16
- initial registry release