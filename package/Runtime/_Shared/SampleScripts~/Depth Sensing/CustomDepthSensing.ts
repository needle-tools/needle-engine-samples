import { Behaviour } from "@needle-tools/engine";
import { ShaderChunk, AgXToneMapping } from "three";

// Documentation → https://docs.needle.tools/scripting

export class CustomDepthSensing extends Behaviour {

    awake() {
        // adjust tonemapping if wanted
        this.context.renderer.toneMapping = AgXToneMapping;

        // Patch three.js shader chunks responsible for depth sensing.
        // @ts-ignore
        ShaderChunk.occlusion_fragment = ShaderChunk.occlusion_fragment.replace(
            // the line we're replacing – this just takes the existing occlusion value and fades objects out.
            `gl_FragColor *= 1.0 - occlusion;`,
            // our new code – draws an intersection line and fades the objects out just a bit, but not fully.
`
float depthMm = Depth_GetCameraDepthInMeters(depthColor, depthUv, arrayIndex);

// requires also patching ShaderChunk.occlusion_pars_fragment and adding some noise function
// float noise = snoise(gl_FragCoord.xy * 0.005);
// depthMm += noise * 0.002;

float absDistance = abs(assetDepthM - depthMm);
float v = 0.0025;
absDistance = saturate(v - absDistance) / v;

gl_FragColor.rgb += vec3(absDistance * 2.0, absDistance * 2.0, absDistance * 12.0);
gl_FragColor = mix(gl_FragColor, vec4(0.0, 0.0, 0.0, 0.0), occlusion * 0.7);
`);
    }
}