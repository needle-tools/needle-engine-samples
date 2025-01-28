import {
    onStart,
    BloomEffect,
  } from 'https://cdn.jsdelivr.net/npm/@needle-tools/engine/dist/needle-engine.min.js';
  
  // Scripting docs: https://engine.needle.tools/docs/scripting.html
  
  onStart((ctx) => {
    const bloom = ctx.scene.addComponent(BloomEffect);
    bloom.threshold.value = .5;
    bloom.intensity.value = 3;
  });