export const shaderVert = `
// Terrain shader for Three.js
// Features:
// - Splat map blending of 4 albedo textures
// - Blended normal mapping from 4 normal maps (tangent-space)
// - Three.js lighting and shadow support (Lambert diffuse)
//
// Usage notes:
// - Create a THREE.ShaderMaterial with these vertex/fragment sources, lights: true.
// - Provide the uniforms declared below (splatMap, albedo0..3, normal0..3, uvScale*, normalScale*).
// - Ensure albedo textures are in linear color space (or convert accordingly in app code).
// - Normal maps expected in tangent space (DX style, XY in [0..1]).

/* ---------- terrain.vert (Vertex Shader) ---------- */

// Based on Three.js standard vertex structure to enable lights, shadows, fog, skinning, morphs etc.

varying vec3 vViewPosition;
#define LAMBERT
#define USE_UV
//#define USE_TANGENT
#define USE_NORMALMAP_TANGENTSPACE
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <envmap_pars_vertex>
#include <normal_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {
	#include <uv_vertex>

	#include <beginnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>

	vViewPosition = -mvPosition.xyz;

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`

export const shaderFrag = `
/* ---------- terrain.frag (Fragment Shader) ---------- */

#define USE_UV
//#define USE_TANGENT
#define USE_NORMALMAP_TANGENTSPACE
#define LAMBERT

#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <normalmap_pars_fragment>

#include <lights_pars_begin>
#include <lights_lambert_pars_fragment> // Lambertian diffuse BRDF
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <tonemapping_pars_fragment>
//#include <colorspace_pars_fragment>

uniform sampler2D splatMap;

uniform sampler2D albedo0;
uniform sampler2D albedo1;
uniform sampler2D albedo2;
uniform sampler2D albedo3;

uniform sampler2D normal0;
uniform sampler2D normal1;
uniform sampler2D normal2;
uniform sampler2D normal3;

uniform vec2 tiling0;
uniform vec2 tiling1;
uniform vec2 tiling2;
uniform vec2 tiling3;

uniform vec2 offset0;
uniform vec2 offset1;
uniform vec2 offset2;
uniform vec2 offset3;

uniform float opacity;

// Additional environment parameters
uniform float roughness;
uniform float metalness;
uniform vec3 emissive;

vec4 getWeights(vec2 uv) {
	vec4 w = texture2D(splatMap, uv);
	float s = w.r + w.g + w.b + w.a;
	if (s > 0.0001) w /= s;
	return clamp(w, 0.0, 1.0);
}

vec3 sampleAlbedo(vec2 uv) {
	vec4 w = getWeights(uv);
	vec3 c0 = texture2D(albedo0, uv * tiling0 + offset0).rgb;
	vec3 c1 = texture2D(albedo1, uv * tiling1 + offset1).rgb;
	vec3 c2 = texture2D(albedo2, uv * tiling2 + offset2).rgb;
	vec3 c3 = texture2D(albedo3, uv * tiling3 + offset3).rgb;
	return c0 * w.r + c1 * w.g + c2 * w.b + c3 * w.a;
}

vec3 sampleBlendedNormal(vec2 uv) {
	vec4 w = getWeights(uv);

	vec2 n0xy = texture2D(normal0, uv * tiling0 + offset0).xy * 2.0 - 1.0;
	float n0z = sqrt(max(0.0, 1.0 - dot(n0xy, n0xy)));
	vec3 n0 = normalize(vec3(n0xy, n0z));

	vec2 n1xy = texture2D(normal1, uv * tiling1 + offset1).xy * 2.0 - 1.0;
	float n1z = sqrt(max(0.0, 1.0 - dot(n1xy, n1xy)));
	vec3 n1 = normalize(vec3(n1xy, n1z));

	vec2 n2xy = texture2D(normal2, uv * tiling2 + offset2).xy * 2.0 - 1.0;
	float n2z = sqrt(max(0.0, 1.0 - dot(n2xy, n2xy)));
	vec3 n2 = normalize(vec3(n2xy, n2z));

	vec2 n3xy = texture2D(normal3, uv * tiling3 + offset3).xy * 2.0 - 1.0;
	float n3z = sqrt(max(0.0, 1.0 - dot(n3xy, n3xy)));
	vec3 n3 = normalize(vec3(n3xy, n3z));

	// Weighted blend in tangent space then renormalize
	vec3 mapN = n0 * w.r + n1 * w.g + n2 * w.b + n3 * w.a;
	return normalize(mapN);
}

vec3 applyTangentSpaceNormal(vec3 n, vec3 viewPos, vec2 uv, vec3 mapN) {
	vec3 q0 = dFdx(viewPos);
	vec3 q1 = dFdy(viewPos);
	vec2 st0 = dFdx(uv);
	vec2 st1 = dFdy(uv);
	vec3 S = normalize(q0 * st1.t - q1 * st0.t);
	vec3 T = normalize(-q0 * st1.s + q1 * st0.s);
	mat3 tbn = mat3(S, T, normalize(n));
	return normalize(tbn * mapN);
}

void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>

	vec3 albedo = sampleAlbedo(vUv);
	// Diffuse base color
	vec4 diffuseColor = vec4(albedo, opacity);
	float specularStrength = 0.5; // Default specular strength
	// Base normal from geometry
	#include <normal_fragment_begin>

	// Apply blended normal map with derivative-based TBN (no explicit tangents needed)
	vec3 mapN = sampleBlendedNormal(vUv);
	normal = normalize( tbn * mapN );

	// Lighting accumulation (Lambert)
	ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
	vec3 totalEmissiveRadiance = vec3(0.0);
	
	#include <lights_lambert_fragment>
	// Evaluate lights, includes shadowing if enabled on the material + lights
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	
	// Apply environment mapping
	#include <envmap_fragment>
	gl_FragColor = vec4(outgoingLight, diffuseColor.a);
	
	// Combine with environment color if available
	#ifdef USE_ENVMAP
		gl_FragColor.rgb += envColor.rgb * envMapIntensity;
	#endif
	
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}

`;