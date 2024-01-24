# Custom XR Hands

Tracked hands are a great way how to make your experience immersive! Needle supports custom hand models that will be used when the target device supports hand tracking. Quest, Quest Pro, Pico 4, Hololens 2, ... support WebXR hand tracking.

[Monster Hands](https://monster-hands.needle.tools) uses this approach to render custom models for both left and right hand.

## Requirements

Custom hands require a specific GameObject structure and/or Bone setup. One approach to making new ones is to modify the default hand models – see "External Hand Assets" below on how to download them.  
This allows you to keep the entire rigging information intact. 

## Setup

Custom hands are configured via the `XRControllerModel` component. In there, you add a reference to your hand models for left and right hand prefabs. It is important that the prefab for the left hand is named "left" and the prefab for the right hand is named "right".

## External Hand Assets

You can also supply a URL to the hands files. By default, hands are fetched from the `webxr-input-profiles` repository:  
https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/