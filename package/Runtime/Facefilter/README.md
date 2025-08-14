
Create your own, completely unique and custom filters that run natively in the browser - with support for multiple faces being tracked at the same time.    
Use the button in the menu `Next Filter` (or A, D or arrow keys) to switch between the filters in the browser.  

The sample comes with 14 fun and cute filters to show off a few features like blendshapes, animations and rendering effects. You can even record videos directly on the website and share it on your social media, send the link to friends or family.

### Face Mesh

Use Procreate or any other 2D painting app like Photoshop to create Facemesh filters - no need to write any code. For quickly testing you can drop your own artwork on the website to use as a filter.  

To use face mesh filters just add the `FaceMesh Texture` or `FaceMesh Video` component to a object in the scene and assign it to the filters in your filter manager component. Make sure to select the correct layout for your texture or video (wether you used Procreate/arkit or the mediapipe/google face layout when you created your texture).

### Animations

To make your animation react to faces simply create `Float` parameters and use [ARKit blendshape names](https://developer.apple.com/documentation/arkit/arfaceanchor/blendshapelocation). For example `jawOpen` has a value between 0 (closed) and 1 (open), `eyeBlinkLeft` and `eyeBlinkRight` for blinking. You can use the `Face Filter Animator` component to see all options. Example: "Facefilter/Examples/Open Mouth.prefab"

### How to use in Unity  

Add the "Needle Filter Tracking Manager" to your scene and click the "Create New Filter" button to get started. Your filter can be edited visually in the Scene View.   

### Npm

[Needle Facefilter are also published on NPM](https://www.npmjs.com/package/@needle-tools/facefilter) and can be installed independently as well: `npm i @needle-tools/facefilter` 
