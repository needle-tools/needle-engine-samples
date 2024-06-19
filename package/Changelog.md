# Changelog
All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

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