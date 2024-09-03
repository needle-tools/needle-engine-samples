
Use Needle to create your own, completely custom and unique Facefilters that run natively in the browser.   

You can record videos directly on the website and share it on your social media - or send the link to friends or family.

The sample comes with 6 fun and cute filters to show off a few features like blendshapes, animations and rendering effects. Use the button in the menu (at the bottom) to change which filter is shown.

Filters can be created in Unity - You don't need to write any code. Add the "Needle Filter Tracking Manager" to your scene and click the "Create New Filter" button to get started. Your filter can be edited visually in the Scene View.

### Animations

To make your animation react to faces simply create `Float` parameters and use [ARKit blendshape names](https://developer.apple.com/documentation/arkit/arfaceanchor/blendshapelocation). For example `jawOpen` has a value between 0 (closed) and 1 (open), `eyeBlinkLeft` and `eyeBlinkRight` for blinking. You can use the `Face Filter Animator` component to see all options. Example: "Facefilter/Examples/Open Mouth.prefab"