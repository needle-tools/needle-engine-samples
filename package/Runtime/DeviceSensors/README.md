# Device sensors

## Gyroscope

Gyroscope sensor is access via [RelativeOrientationSensor](https://developer.mozilla.org/en-US/docs/Web/API/RelativeOrientationSensor) API or [DeviceOrientation](https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Detecting_device_orientation). Where the later is a fallback api with wider platform support.

If the device doesn't support any implemented method the `onfail` event is raised on the Gyroscope.

## Panorama Controls

Ideal for 360 viewers with support for classic drag controls. Supports 