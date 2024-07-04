# External Content
Not all content needs to be packaged in the main build and loaded right at the start.
Downloading and spawning content on demand is a good practice to lower the initial load time.

## URL parameters
This sample also showcases how to read and set URL parameters. Your URL can contain a link to remote assets like so:
www.example.com/?model=https://model.page/?file=abc.glb

This can be helpful when your users share the URL or generate QR codes.
