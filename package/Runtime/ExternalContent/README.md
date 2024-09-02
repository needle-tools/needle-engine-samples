# External Content
Not all content needs to be packaged in the main build and loaded right at the start.
Downloading and spawning content on demand is a good practice to lower the initial load time.

## URL parameters
This sample also showcases how to read and set URL parameters. Your URL can contain a link to remote assets like so:
`?model={URL}`

Concrete example would be like so:
https://engine.needle.tools/samples-uploads/dynamic-content/?model=https%3A%2F%2Fraw.githubusercontent.com%2FKhronosGroup%2FglTF-Sample-Models%2Fmaster%2F2.0%2FDamagedHelmet%2FglTF-Embedded%2FDamagedHelmet.gltf

The inner URLs should be encoded, you can read more [here](<https://www.w3schools.com/tags/ref_urlencode.ASP>).