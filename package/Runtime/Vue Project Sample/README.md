# Vue.js Integration

This sample demonstrates how to integrate the [Vue.js](https://vuejs.org/) frontend framework with Needle Engine. Our [vuejs project template](https://github.com/needle-engine/vuejs-sample) is hosted and downloaded from github when you run the scene in Unity.  

In this sample the needle engine web component is added to the [App.vue](https://github.com/needle-engine/vuejs-sample/blob/0d0e5b265c5dd26a65148fa3a94a0d1d5191e441/src/App.vue#L26) component. The content of the 3D scene integrates seamlessly with the web components: content uses zIndex to be either rendered in front or behind the 3D content.

Additionally the sample shows how an Animator and a animation statemachine (in this example setup and animated in Unity) can be controlled from the web frontend.   

The sample is also networked. Send the sample URL containing the room name to a friend (or open it in a second browser window) and you will notice that the shown slide is synchronized between all users on the same website.

## Learn more

For more information, see the [Vue.js docs](https://vuejs.org/guide/introduction.html).

Our main website [needle.tools](https://needle.tools) is built using Vue.js.
