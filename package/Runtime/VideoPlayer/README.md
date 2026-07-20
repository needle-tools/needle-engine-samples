# Video Playback

Play video inside a 3D web scene — on a mesh, in fullscreen, or as a raw video texture you can use however you like. The `VideoPlayer` component drives it all, from a local file, a URL, or an HLS livestream, running in the browser with Needle Engine.

It also handles transparent video three ways: WebM with an alpha channel, side-by-side with a mask, and greenscreen (chroma-key) removal — useful for floating presenters, product overlays, and effects. Under the hood it uses the HTML video element, and since browsers only allow audio after a user interaction, VideoPlayer starts muted and unmutes on the first click.

**Learn more**
- [VideoPlayer](https://engine.needle.tools/docs/api/VideoPlayer) — API reference
