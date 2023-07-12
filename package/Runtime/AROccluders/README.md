# AR Occluders

Gives you the ability to punch a hole through the scene and display the background only. In the context of XR, that would be the camera feed/pass-through.

It works through a shader that denies any other objects to appear on that part of the screen, and the background is the only thing that is rendered before that. 

You can define a shape of the occlusion by the mesh you use with the occlusion material.