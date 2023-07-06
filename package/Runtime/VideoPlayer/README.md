# Video sample

The sample is comprised of:
- Normal non-transparent video
- Composited transparent video with a custom shader graph shader
- Transparent WebM that has limited support

---

Videos are tied to the VideoPlayer component. If you want to set up a video that starts playing on start, you can simply set the URL of the video / select the video asset and enable play on awake. Then you need to specify where the video will be visible. To display it on a 3D object, you need to set RenderMode to MaterialOverride and choose a renderer and adequate texture property that should be updated with the video texture.

---

VideoPlayer has all the needed API, but if you would lack something, you can always access the video element property. That exposes the video HTML element, and you can utilize the [standard API on it](https://www.w3schools.com/tags/ref_av_dom.asp).

---

Mind that videos can't always autoplay on all platforms. The behaviour can differ if the video has a sound as well. The user usually has to interact with the page at least once so the video can start playing.

---

Lastly, if you want to change the video texture with a shader, refer to the `CombinedVideo.ts`, where fundamentally, you assign the video texture to the material texture. Mind that the shader property naming is crucial. 

---

> Video attribution:
(c) copyright Blender Foundation | www.bigbuckbunny.org, CC BY 3.0 <https://creativecommons.org/licenses/by/3.0>, via Wikimedia Commons