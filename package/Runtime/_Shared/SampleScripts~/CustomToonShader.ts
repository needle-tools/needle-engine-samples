import { Behaviour, MeshRenderer, serializable } from "@needle-tools/engine";
import { Color, ShaderMaterial, UniformsLib } from "three";

// From https://www.maya-ndljk.com/blog/threejs-basic-toon-shader 
// by https://twitter.com/maya_ndljk

const vertexShader = `
#include <common>
#include <shadowmap_pars_vertex>

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
    #include <beginnormal_vertex>
    #include <defaultnormal_vertex>

    #include <begin_vertex>

    #include <worldpos_vertex>
    #include <shadowmap_vertex>

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 clipPosition = projectionMatrix * viewPosition;

    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-viewPosition.xyz);

    gl_Position = clipPosition;

}
`;

const fragmentShader = `
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

uniform vec3 uColor;
uniform float uGlossiness;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
    // shadow map
    DirectionalLightShadow directionalLight = directionalLightShadows[0];

    float shadow = getShadow(
        directionalShadowMap[0],
        directionalLight.shadowMapSize,
        directionalLight.shadowBias,
        directionalLight.shadowRadius,
        vDirectionalShadowCoord[0]
    );

    // directional light
    float NdotL = dot(vNormal, directionalLights[0].direction);
    float lightIntensity = smoothstep(0.0, 0.01, NdotL * shadow);
    vec3 light = directionalLights[0].color * lightIntensity;

    // specular light
    vec3 halfVector = normalize(directionalLights[0].direction + vViewDir);
    float NdotH = dot(vNormal, halfVector);

    float specularIntensity = pow(NdotH * lightIntensity, uGlossiness * uGlossiness);
    float specularIntensitySmooth = smoothstep(0.05, 0.1, specularIntensity);

    vec3 specular = specularIntensitySmooth * directionalLights[0].color;

    // rim lighting
    float rimDot = 1.0 - dot(vViewDir, vNormal);
    float rimAmount = 0.6;

    float rimThreshold = 0.2;
    float rimIntensity = rimDot * pow(NdotL, rimThreshold);
    rimIntensity = smoothstep(rimAmount - 0.01, rimAmount + 0.01, rimIntensity);

    vec3 rim = rimIntensity * directionalLights[0].color;

    gl_FragColor = vec4(uColor * (ambientLightColor + light + specular + rim), 1.0);
}
`

export class CustomToonShader extends Behaviour {

    @serializable(Color)
    toonColor! : Color;

    onEnable() {
        const renderer = this.gameObject.getComponent(MeshRenderer);
        if (!renderer) {
            console.warn("CustomToonShader requires a MeshRenderer component");
            return;
        }
        const material = new ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            lights: true,
            uniforms: {
                ...UniformsLib.lights,
                uColor: { value: this.toonColor },
                uGlossiness: { value: 10 }
            }
        });

        for (let i = 0; i < (renderer?.sharedMaterials?.length ?? 0); i++) {
            renderer.sharedMaterials[i] = material;
        }
    }


}