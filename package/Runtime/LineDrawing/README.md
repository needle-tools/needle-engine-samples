# Line Drawing

This app demonstrates how to draw a line based on user input – a basic yet powerful feature that can be used for annotations, small scribbles, games, and more. 
It's basically a feature complete 3D whiteboard!

## Collaborative Drawing

Using Needle Engine's built-in networking, this sample demonstrates how custom data can be synchronized between multiple users. Here, both brush information (width, color, brush type) and line information are sent and received, to allow for collaborative drawing.

Collaboration works entirely cross-platform – users can be on any device with a browser.  
The sample also contains both our Avatar and Voice Chat (VoIP) features, which means users can see and talk to each other while drawing.

## Device Support

The Line Drawing sample is supported on all devices and modes that Needle Engine supports.
This includes screen-based devices (desktop, mobile, tablet), VR headsets, and AR devices.  

### Meta Quest
On Meta Quest, the sample supports both hand tracking and controllers. In AR, we enable so-called `unbounded` space, which means users can move around freely, without guardian/boundaries.

### Logitech MX Ink
On Meta Quest, the Logitech MX Ink spatial stylus is fully supported. Pressure-sensitive drawing with both tip and touch input work out of the box.
Learn more at [logitech.com](https://www.logitech.com/en-us/products/vr/mx-ink.html).

### Apple Vision Pro
Notably, Apple Vision Pro is supported without any additional changes, since it is fully integrated into our input system. Both hand tracking and transient pointers (eye+hand tracking) are supported for drawing.

## Brush Settings

You can set up new brushes on the `LinesManager` component.  
Each brush has a name, color, width, texture(s) and blend mode.

At runtime, you can switch which brush is active on `LinesDrawer`.