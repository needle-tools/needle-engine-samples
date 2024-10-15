# Embedding other websites

Content from other websites can be overlayed on top of 3D scenes using iframes. Make sure that your concept fits.

## Limitations

iframes are rendered using CSS3D. This is currently not supported by browsers in VR. If you want to play videos in VR or AR, use a `VideoPlayer` component with a video file.
Also mind that when embedding a website, you need to manually allow for certain permissions. See [the documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe).