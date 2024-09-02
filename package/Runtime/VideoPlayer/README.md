# Video sample

### Sample contains
 - Local video
 - Video from URL
 - Video from HLS Livestream
 - Transparent Video (WebM with Alpha Channel)
 - Transparent Video (side-by-side with mask)
 - Transparent Video (greenscreen keying)

### Intro
Playing videos is possible with the VideoPlayer component. Videos can be displayed on meshes, in fullscreen or you can access the video texture and adjust it however you like. This is defined by the RenderMode on the component. Under the hood, the VideoPlayer uses the HTML Video element.

### Permissions
Audio can only play after a user interaction. VideoPlayer takes care of this and plays the video muted until the user has interacted with the page.