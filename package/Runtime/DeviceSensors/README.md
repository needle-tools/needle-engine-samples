# Device sensors

## Gyroscope

This sample provides a Gyroscope class that wraps the [RelativeOrientationSensor](https://developer.mozilla.org/en-US/docs/Web/API/RelativeOrientationSensor) API and [DeviceOrientation](https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Detecting_device_orientation). Where the later is a fallback method with wider platform support.

If the device doesn't support any implemented method the `onfail` event is raised on the Gyroscope.

## Device Sensors

Explainer sample that shows how to handle gyroscope support.

## Panorama Controls

Place this component onto your camera object to get drag-to-look camera controls with gyroscope support. It features FOV zoom, idle auto-spin, and other capabilities ideal for 360 viewer applications.