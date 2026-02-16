# Camera Input

Create AR-like experiences by displaying live webcam video as a background behind your interactive 3D content.

## Use Cases

Perfect for building AR prototypes, video effects, interactive mirrors, and any application where you want to blend 3D content with real-world camera input right in the browser.

## What This Sample Shows

- **Live Camera Background** - The `VideoBackground` component streams your device camera as a fullscreen background
- **Interactive Physics** - Cubes with `Rigidbody` and `BoxCollider` components respond to gravity and collisions
- **Visual Feedback** - The `ChangeColorOnCollision` component makes cubes change color when they collide
- **3D Navigation** - `OrbitControls` lets you navigate around the scene while the camera feed plays

## Components Used

**VideoBackground** - Requests camera access and displays the feed as a background layer. Handles browser permissions and cleanup automatically.

**ChangeColorOnCollision** - Provides visual feedback by changing material colors during physics collisions, then restoring them when objects separate.

## Browser Permissions

Your browser will ask for camera permission the first time you run this sample - this protects user privacy.

## Related Samples

- [Facefilter](https://engine.needle.tools/samples/facefilter/) - Advanced face tracking and AR filters with camera input
- [ARBackground](https://engine.needle.tools/samples/ar-background/) - WebXR AR camera background access
