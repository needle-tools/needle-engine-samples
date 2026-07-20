# MediaPipe Hands

Add real-time hand tracking to your web 3D scenes and let visitors control objects with their hands, no controller or install required. Powered by Google MediaPipe, it runs entirely in the browser, including on phones.

This sample wires the webcam feed into MediaPipe's hand-tracking model, reads finger and palm positions every frame, and drives a reactive particle sphere from that data. It's a compact starting point for gesture input, and you can swap in other MediaPipe models like face or pose tracking.

- Browser-based hand and finger tracking via the device camera
- Live gesture data mapped onto a three.js particle effect
- Works on desktop and mobile without any app

**Learn more**

- [MediaPipe Solutions guide](https://developers.google.com/mediapipe)
- [ParticleSystem component](https://engine.needle.tools/docs/api/ParticleSystem)
- [OrbitControls component](https://engine.needle.tools/docs/api/OrbitControls)
