# Device Sensors

Turn a phone into a window you can look through. This sample reads your device's motion sensors, so people can explore a 360° scene simply by moving their phone around — tilt up to see the sky, turn around to look behind them.

## Panorama Controls

Drop [**Panorama Controls**](https://github.com/needle-tools/needle-engine-samples/blob/main/package/Runtime/DeviceSensors/Scripts/Samples.Sensors~/PanoramaControls.ts) onto your camera and you've got a polished 360° viewer out of the box: drag to look around, pinch or scroll to zoom, and a gentle auto-spin that invites people in when they're idle. On phones it uses the gyroscope automatically, and you can offer a button to switch that on or off. Great for virtual tours, product panoramas, and immersive backdrops.

## Gyroscope

Under the hood, the [`Gyroscope.ts`](https://github.com/needle-tools/needle-engine-samples/blob/main/package/Runtime/DeviceSensors/Scripts/Samples.Sensors~/Gyroscope.ts) script handles the tricky part of reading device orientation across phones. It uses the modern [RelativeOrientationSensor](https://developer.mozilla.org/en-US/docs/Web/API/RelativeOrientationSensor) where available and falls back to [DeviceOrientation](https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Detecting_device_orientation) for wider support. If a device can't do either, it lets you know so you can fall back gracefully to drag controls.
