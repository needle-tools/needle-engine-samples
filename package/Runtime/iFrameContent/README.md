# Embedding other websites

Content from other websites can be embedded into 3D scenes using iframes. These have a number of limitations, including which permissions the embedded website has (for example AR, VR, audio playback, and so on).  

## Limitations

iframes are rendered using CSS3D. This is currently not supported by browsers in VR. If you want to play videos in VR or AR, use a `VideoPlayer` component with a video file.