# Device sensors

## Gyroscope

Gyroscope sensor is access via [RelativeOrientationSensor](https://developer.mozilla.org/en-US/docs/Web/API/RelativeOrientationSensor) API or [DeviceOrientation](https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Detecting_device_orientation). Where the later is a fallback api with wider platform support.

If the device doesn't support any implemented method the `onfail` event is raised on the Gyroscope.

## Panorama Controls

Place this component onto your camera object to get drag-to-look camera controls with gyroscope support. It features FOV zoom, idle auto-spin, and other capabilities ideal for 360 viewer applications.