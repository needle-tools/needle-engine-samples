import { Context, ContextEvent, ContextRegistry, showBalloonWarning } from "@needle-tools/engine";


import WebGPU from 'three/examples/jsm/capabilities/WebGPU.js';
import WebGPURenderer from 'three/examples/jsm/renderers/webgpu/WebGPURenderer.js';
import { cubeTexture, texture, normalMap, toneMapping } from 'three/examples/jsm/nodes/Nodes.js';
import { LinearToneMapping, sRGBEncoding } from 'three';

ContextRegistry.registerCallback(ContextEvent.ContextCreated, (args) => {


    if (WebGPU.isAvailable() === false) {
        showBalloonWarning("WebGPU is not available");
        return;
    }

    const renderer = new WebGPURenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMappingNode = toneMapping(LinearToneMapping, 1);
    renderer.outputEncoding = sRGBEncoding;
    args.context.renderer = renderer;

});

function toneMapping(LinearToneMapping: number, arg1: unknown): any {
}
