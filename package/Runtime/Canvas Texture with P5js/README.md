# P5.js integration

## About p5.js
> p5.js is a JavaScript library for creative coding, with a focus on making coding accessible and inclusive for artists, designers, educators, beginners, and anyone else! p5.js is free and open-source because we believe software, and the tools to learn it, should be accessible to everyone.

*(From [p5js.org](https://p5js.org/))*

The drawing and p5.js integration is located in the `index.html` inside of the web project.
(`WebProjects~/Canvas_P5js`)

p5.js is rendering into a canvas element which we query for and gather a texture that we set to the shared material. That's located in the sample's npm module. 
(`Runtime/Canvas Texture with P5js/P5js~/CanvasToObject.ts`)

Mind that the three.js texture needs to be flagged to update every frame. (Hence the update method in the CanvasToObject.ts) 