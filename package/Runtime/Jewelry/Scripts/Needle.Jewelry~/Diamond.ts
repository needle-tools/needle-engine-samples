import { Context, Behaviour, DeviceUtilities, GameObject, USDZExporter, delay, serializable } from "@needle-tools/engine";
import { Object3D, ShaderMaterial, Vector2, Color, Mesh, BufferGeometry } from "three"
import { shaderStructs, shaderIntersectFunction, MeshBVHUniformStruct, MeshBVH, SAH } from "three-mesh-bvh";

export class Diamond extends Behaviour {

	@serializable()
	disableOnMobile: boolean = false;

	async start() {

		// If we are exporting to usdz, we need to swap the diamond for the original,
		// as iOS QuickLook does not support custom shaders
		const usdzExporter = GameObject.findObjectOfType(USDZExporter);
		if (usdzExporter) {
			usdzExporter.addEventListener("before-export", () => {
				if (!this.original || !this.customDiamond) return;
				this.customDiamond.parent?.add(this.original);
				this.customDiamond.parent?.remove(this.customDiamond);
			});
			usdzExporter.addEventListener("after-export", () => {
				if (!this.original || !this.customDiamond) return;
				this.original.parent?.add(this.customDiamond);
				this.original.parent?.remove(this.original);
			});
		}

        if (this.disableOnMobile && Diamond.isMobile()) return;

		const obj = Diamond.create(this.context, this.gameObject);
		if (!obj) return;

		const parent = this.gameObject.parent;
		this.original = this.gameObject;
		this.customDiamond = obj;
		
		this.gameObject.removeFromParent();
		parent?.add(obj);
		obj.position.copy(this.gameObject.position);
		obj.rotation.copy(this.gameObject.rotation);
		obj.scale.copy(this.gameObject.scale);
	}

    private static isMobile() {
        return DeviceUtilities.isiOS() || DeviceUtilities.isMobileDevice() || DeviceUtilities.isQuest();
    }

	private static _diamondMaterial: ShaderMaterial | undefined;
	private static _mesh: Map<BufferGeometry, MeshBVH> = new Map();

	private original?: Object3D;
	private customDiamond?: Object3D;

	//@nonSerialized
	static create(context: Context, obj: Object3D): Object3D | undefined {
        console.log(obj, obj.type)
		if (obj.type === "Mesh") {
			let mesh = obj as Mesh;
			if (!this._mesh.has(mesh.geometry)) {
				const geo = mesh.geometry.clone();
				this._mesh.set(mesh.geometry, new MeshBVH(geo, { strategy: SAH, maxLeafTris: 1 }));
			}
			const mat = this.getDiamondMaterial(context);
            const bvh = this._mesh.get(mesh.geometry)!;
			mesh = new Mesh();
			mesh.geometry = bvh.geometry;
			if (mat) {
				mat.uniforms.bvh.value.updateFrom(bvh);
				mat.needsUpdate = true;
				mesh["material"] = mat;
			}
			return mesh;
		}
		else if (obj.type === "Group") {
			for (const ch of obj.children) {
				return this.create(context, ch);
			}
		}
        else if (obj.type === "Object3D") {
            for (const ch of obj.children) {
                return this.create(context, ch);
            }
        }

		return undefined;
	}

    // Diamond custom shader. Could also switch to https://github.com/pmndrs/drei/blob/master/src/core/MeshRefractionMaterial.tsx

	//@nonSerialized
	static getDiamondMaterial(context: Context): ShaderMaterial {
		if (this._diamondMaterial) return this._diamondMaterial;

		// simplify features for mobile devices to save performance
        const bounces = this.isMobile() ? 2 : 3;
        const fastChroma = this.isMobile() ? true : false;
        const aberrationStrength = this.isMobile() ? 0.0 : 0.02;

		const cam = context.mainCamera;
		// initialize the diamond material
		return new ShaderMaterial({
			uniforms: {
				// scene / geometry information
				envMap: { value: context.scene.environment },
				correctMips: { value: false },
				fresnel: { value: 0 },
				bvh: { value: new MeshBVHUniformStruct() },
				projectionMatrixInverse: { value: cam?.projectionMatrixInverse },
				viewMatrixInverse: { value: cam?.matrixWorld },
				resolution: { value: new Vector2(100, 100) },

				// internal reflection settings
				bounces: { value: bounces },
				ior: { value: 2.4 },

				// chroma and color settings
				color: { value: new Color(1, 1, 1) },
				fastChroma: { value: fastChroma },
				aberrationStrength: { value: aberrationStrength },
			},
			defines: {
				"CHROMATIC_ABERRATIONS": !this.isMobile(),
			},
			vertexShader: /*glsl*/ `
				uniform mat4 viewMatrixInverse;

				varying vec3 vWorldPosition;
				varying vec3 vNormal;
				varying mat4 vModelMatrixInverse;

				#include <color_pars_vertex>

				void main() {
					#include <color_vertex>

					vec4 transformedNormal = vec4(normal, 0.0);
					vec4 transformedPosition = vec4(position, 1.0);
					#ifdef USE_INSTANCING
					transformedNormal = instanceMatrix * transformedNormal;
					transformedPosition = instanceMatrix * transformedPosition;
					#endif

					#ifdef USE_INSTANCING
					vModelMatrixInverse = inverse(modelMatrix * instanceMatrix);
					#else
					vModelMatrixInverse = inverse(modelMatrix);
					#endif

					vWorldPosition = (modelMatrix * transformedPosition).xyz;
					vNormal = normalize((viewMatrixInverse * vec4(normalMatrix * transformedNormal.xyz, 0.0)).xyz);
					gl_Position = projectionMatrix * viewMatrix * modelMatrix * transformedPosition;
		}
		`,
			fragmentShader:   /*glsl*/ `
			#define ENVMAP_TYPE_CUBE_UV
			precision highp isampler2D;
			precision highp usampler2D;
			varying vec3 vWorldPosition;
			varying vec3 vNormal;
			varying mat4 vModelMatrixInverse;
		  
			#include <color_pars_fragment>
		  
			#ifdef ENVMAP_TYPE_CUBEM
			  uniform samplerCube envMap;
			#else
			  uniform sampler2D envMap;
			#endif
		  
			uniform float bounces;
			// ${shaderStructs}
			// ${shaderIntersectFunction}
			uniform BVH bvh;
			uniform float ior;
			// uniform bool correctMips;
			uniform vec2 resolution;
			uniform float fresnel;
			uniform mat4 modelMatrix;
			uniform mat4 projectionMatrixInverse;
			uniform mat4 viewMatrixInverse;
			uniform float aberrationStrength;
			uniform vec3 color;
			uniform float opacity;
		  
			float fresnelFunc(vec3 viewDirection, vec3 worldNormal) {
			  return pow( 1.0 + dot( viewDirection, worldNormal), 10.0 );
			}
		  
			vec3 totalInternalReflection(vec3 ro, vec3 rd, vec3 normal, float ior, mat4 modelMatrixInverse) {
			  vec3 rayOrigin = ro;
			  vec3 rayDirection = rd;
			  rayDirection = refract(rayDirection, normal, 1.0 / ior);
			  rayOrigin = vWorldPosition + rayDirection * 0.001;
			  rayOrigin = (modelMatrixInverse * vec4(rayOrigin, 1.0)).xyz;
			  rayDirection = normalize((modelMatrixInverse * vec4(rayDirection, 0.0)).xyz);
			  for(float i = 0.0; i < bounces; i++) {
				uvec4 faceIndices = uvec4( 0u );
				vec3 faceNormal = vec3( 0.0, 0.0, 1.0 );
				vec3 barycoord = vec3( 0.0 );
				float side = 1.0;
				float dist = 0.0;
				bvhIntersectFirstHit( bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist );
				vec3 hitPos = rayOrigin + rayDirection * max(dist - 0.001, 0.0);
				vec3 tempDir = refract(rayDirection, faceNormal, ior);
				if (length(tempDir) != 0.0) {
				  rayDirection = tempDir;
				  break;
				}
				rayDirection = reflect(rayDirection, faceNormal);
				rayOrigin = hitPos + rayDirection * 0.01;
			  }
			  rayDirection = normalize((modelMatrix * vec4(rayDirection, 0.0)).xyz);
			  return rayDirection;
			}
		  
			#include <common>
			// #include <cube_uv_reflection_fragment>
		  
			#ifdef ENVMAP_TYPE_CUBEM
			  vec4 textureGradient(samplerCube envMap, vec3 rayDirection, vec3 directionCamPerfect) {
				vec2 dx = dFdx(directionCamPerfect); // dFdx(correctMips ? directionCamPerfect: rayDirection);
				vec2 dy = dFdy(directionCamPerfect); // dFdy(correctMips ? directionCamPerfect: rayDirection);
			  	return textureGrad(envMap, rayDirection, dx, dy);
			  }
			#else
			  vec4 textureGradient(sampler2D envMap, vec3 rayDirection, vec3 directionCamPerfect) {
				vec2 uvv = equirectUv( rayDirection );
				vec2 smoothUv = equirectUv( directionCamPerfect );
				vec2 dx = dFdx(smoothUv); // dFdx(correctMips ? smoothUv : uvv);
				vec2 dy = dFdy(smoothUv); // dFdy(correctMips ? smoothUv : uvv);
				return textureGrad(envMap, uvv, dx, dy);
			  }
			#endif
		  
			void main() {
			  vec2 uv = gl_FragCoord.xy / resolution;

			  vec3 directionCamPerfect = (projectionMatrixInverse * vec4(uv * 2.0 - 1.0, 0.0, 1.0)).xyz;
			  directionCamPerfect = (viewMatrixInverse * vec4(directionCamPerfect, 0.0)).xyz;
			  directionCamPerfect = normalize(directionCamPerfect);
			  vec3 normal = vNormal;
			  vec3 rayOrigin = cameraPosition;
			  vec3 rayDirection = normalize(vWorldPosition - cameraPosition);
		  
			  vec4 diffuseColor = vec4(color, opacity);
			  #include <color_fragment>

			  #ifdef CHROMATIC_ABERRATIONS
				vec3 rayDirectionG = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior, 1.0), vModelMatrixInverse);
				#ifdef FAST_CHROMA
				  vec3 rayDirectionR = normalize(rayDirectionG + 1.0 * vec3(aberrationStrength / 2.0));
				  vec3 rayDirectionB = normalize(rayDirectionG - 1.0 * vec3(aberrationStrength / 2.0));
				#else
				  vec3 rayDirectionR = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior * (1.0 - aberrationStrength), 1.0), vModelMatrixInverse);
				  vec3 rayDirectionB = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior * (1.0 + aberrationStrength), 1.0), vModelMatrixInverse);
				#endif
				float finalColorR = textureGradient(envMap, rayDirectionR, directionCamPerfect).r;
				float finalColorG = textureGradient(envMap, rayDirectionG, directionCamPerfect).g;
				float finalColorB = textureGradient(envMap, rayDirectionB, directionCamPerfect).b;
				diffuseColor.rgb *= vec3(finalColorR, finalColorG, finalColorB);
			  #else
				rayDirection = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior, 1.0), vModelMatrixInverse);
				diffuseColor.rgb *= textureGradient(envMap, rayDirection, directionCamPerfect).rgb;
			  #endif
		  
			  vec3 viewDirection = normalize(vWorldPosition - cameraPosition);

			  float nFresnel = fresnelFunc(viewDirection, normal) * fresnel;
			  gl_FragColor = vec4(mix(diffuseColor.rgb, vec3(1.0), nFresnel), 1.0);

			  #include <tonemapping_fragment>
			  #include <${169 >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
			}`
		});
	}
}



