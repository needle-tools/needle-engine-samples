# Custom XR Hands

Tracked hands are a great way how to make your experience immersive! Needle supports custom hand models that will be used when the target device supports hand tracking. Quest, Quest Pro, Pico 4, Hololens 2, ... support WebXR hand tracking.

[Monster Hands](https://monster-hands.needle.tools) uses this approach to render custom models for both left and right hand.

## Requirements

Custom hands require a specific GameObject structure and/or Bone setup. One approach to making new ones is to modify the default hand models – see "External Hand Assets" below on how to download them.  
This allows you to keep the entire rigging information intact. 

## Setup

Custom hands are configured via the `WebXR` component. In there, you specify a runtime path to a directory that contains your custom hand models.

This means that you need to create two `.glb` files that contain your left and right hand. 

This sample is set up in a way that you can directly edit the hands from the scene. The setup is as follows:
- add your hands to your scene
- name the GameObjects `left` and `right`
- disable them and add a `GltfObject` component
Adding the component results in the scene getting exported as three separate files – the main `.glb`, `right.glb` and `left.glb`. 
- specify the custom hands path in the `WebXR` component as `/`.

## External Hand Assets

You can also supply a URL to the hands files. By default, hands are fetched from the `webxr-input-profiles` repository:  
https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/