
Use Needle to create your own, completely custom and unique filters that run natively in the browser. Use the button in the menu `Next Filter` (or arrow keys) to try out all the filters in the browser.

You can record videos directly on the website and share it on your social media - or send the link to friends or family. You can even drop your own artwork on the website to use as a filter.

The sample comes with 14 fun and cute filters to show off a few features like blendshapes, animations and rendering effects. Use the button in the menu (at the bottom) to change which filter is shown.

Filters can be created in Unity or in Procreate - You don't need to write any code. Add the "Needle Filter Tracking Manager" to your scene and click the "Create New Filter" button to get started. Your filter can be edited visually in the Scene View.


### Face Mesh

To use face mesh filters just add the `FaceMesh Texture` or `FaceMesh Video` component to a object in the scene and assign it to the filters in your filter manager component. Make sure to select the correct layout for your texture or video (wether you used procreate or the mediapipe/google face layout when you created your texture).

### Animations

To make your animation react to faces simply create `Float` parameters and use [ARKit blendshape names](https://developer.apple.com/documentation/arkit/arfaceanchor/blendshapelocation). For example `jawOpen` has a value between 0 (closed) and 1 (open), `eyeBlinkLeft` and `eyeBlinkRight` for blinking. You can use the `Face Filter Animator` component to see all options. Example: "Facefilter/Examples/Open Mouth.prefab"
