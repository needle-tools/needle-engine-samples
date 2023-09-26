# JavaScript interoperability

Communication between Needle Engine and external javascript.

In the scene, there is a component called ExampleManager, that example manager is defined in an NPMDef. The web project imports that NPMDef and in the index.ts exports specific contents of it.

This way in the `myscript.js` you are able to import the module and call the API, resulting in a simple bridge between Needle and your website.

Mind that the NPMDef is not necessary if you wish to maintain the app logic directly in the web project.