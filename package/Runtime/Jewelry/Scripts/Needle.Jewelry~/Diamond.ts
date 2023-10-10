import { Behaviour, GameObject, USDZExporter, isQuest, serializable } from "@needle-tools/engine";
import { Context } from "@needle-tools/engine";
import { isiOS, isMobileDevice } from "@needle-tools/engine";
import { Object, ShaderMaterial, Vector2, Color, Mesh, BufferGeometry } from "three"
//@ts-ignore
import { shaderIntersectFunction } from "three-mesh-bvh";
import { shaderStructs, MeshBVHUniformStruct, MeshBVH, SAH } from "three-mesh-bvh";


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
				this.customDiamond.parent.add(this.original);
				this.customDiamond.parent.remove(this.customDiamond);
			});
			usdzExporter.addEventListener("after-export", () => {
				if (!this.original || !this.customDiamond) return;
				this.original.parent.add(this.customDiamond);
				this.original.parent.remove(this.original);
			});
		}

        if (this.disableOnMobile && Diamond.isMobile()) return;

		const obj = Diamond.create(this.context, this.gameObject);
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
        return isiOS() || isMobileDevice() || isQuest();
    }

	private static _diamondMaterial: ShaderMaterial | undefined;
	private static _mesh: Map<BufferGeometry, MeshBVH> = new Map();

	private original: Object;
	private customDiamond: Object;

	//@nonSerialized
	static create(context: Context, obj: Object): Object {
        console.log(obj, obj.type)
		if (obj.type === "Mesh") {
			let mesh = obj as Mesh;
			if (!this._mesh.has(mesh.geometry)) {
				const geo = mesh.geometry.clone();
				this._mesh.set(mesh.geometry, new MeshBVH(geo, { strategy: SAH, maxLeafTris: 1 }));
			}
			const mat = this.getDiamondMaterial(context);
            const bvh = this._mesh.get(mesh.geometry)!;
			mat.uniforms.bvh.value.updateFrom(bvh);
			mesh = new Mesh();
			mesh.geometry = bvh.geometry;
			mesh["material"] = mat;
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
				bvh: { value: new MeshBVHUniformStruct() },
				projectionMatrixInv: { value: cam?.projectionMatrixInverse },
				viewMatrixInv: { value: cam?.matrixWorld },
				resolution: { value: new Vector2(100, 100) },

				// internal reflection settings
				bounces: { value: bounces },
				ior: { value: 2.4 },

				// chroma and color settings
				color: { value: new Color(1, 1, 1) },
				fastChroma: { value: fastChroma },
				aberrationStrength: { value: aberrationStrength },

			},
			vertexShader: /*glsl*/ `
			varying vec3 vWorldPosition;
			varying vec3 vNormal;
			uniform mat4 viewMatrixInv;
			void main() {
				vWorldPosition = ( modelMatrix * vec4( position, 1.0 ) ).xyz;
				vNormal = ( viewMatrixInv * vec4( normalMatrix * normal, 0.0 ) ).xyz;
				gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position , 1.0 );
			}
		`,
			fragmentShader: /*glsl*/ `
			#define RAY_OFFSET 0.0001
			#include <common>
			precision highp isampler2D;
			precision highp usampler2D;
			// ${shaderStructs}
			// ${shaderIntersectFunction}
			varying vec3 vWorldPosition;
			varying vec3 vNormal;
			uniform sampler2D envMap;
			uniform float bounces;
			uniform BVH bvh;
			uniform float ior;
			uniform vec3 color;
			uniform bool fastChroma;
			uniform mat4 projectionMatrixInv;
			uniform mat4 viewMatrixInv;
			uniform mat4 modelMatrix;
			uniform vec2 resolution;
			uniform float aberrationStrength;
			#include <cube_uv_reflection_fragment>
			// performs an iterative bounce lookup modeling internal reflection and returns
			// a final ray direction.
			vec3 totalInternalReflection( vec3 incomingOrigin, vec3 incomingDirection, vec3 normal, float ior, mat4 modelMatrixInverse ) {
				vec3 rayOrigin = incomingOrigin;
				vec3 rayDirection = incomingDirection;
				// refract the ray direction on the way into the diamond and adjust offset from
				// the diamond surface for raytracing
				rayDirection = refract( rayDirection, normal, 1.0 / ior );
				rayOrigin = vWorldPosition + rayDirection * RAY_OFFSET;
				// transform the ray into the local coordinates of the model
				rayOrigin = ( modelMatrixInverse * vec4( rayOrigin, 1.0 ) ).xyz;
				rayDirection = normalize( ( modelMatrixInverse * vec4( rayDirection, 0.0 ) ).xyz );
				// perform multiple ray casts
				for( float i = 0.0; i < bounces; i ++ ) {
					// results
					uvec4 faceIndices = uvec4( 0u );
					vec3 faceNormal = vec3( 0.0, 0.0, 1.0 );
					vec3 barycoord = vec3( 0.0 );
					float side = 1.0;
					float dist = 0.0;
					// perform the raycast
					// the diamond is a water tight model so we assume we always hit a surface
					bvhIntersectFirstHit( bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist );
					// derive the new ray origin from the hit results
					vec3 hitPos = rayOrigin + rayDirection * dist;
					// if we don't internally reflect then end the ray tracing and sample
					vec3 refractedDirection = refract( rayDirection, faceNormal, ior );
					bool totalInternalReflection = length( refract( rayDirection, faceNormal, ior ) ) == 0.0;
					if ( ! totalInternalReflection ) {
						rayDirection = refractedDirection;
						break;
					}
					// otherwise reflect off the surface internally for another hit
					rayDirection = reflect( rayDirection, faceNormal );
					rayOrigin = hitPos + rayDirection * RAY_OFFSET;
				}
				// return the final ray direction in world space
				return normalize( ( modelMatrix * vec4( rayDirection, 0.0 ) ).xyz );
			}
			vec4 envSample( sampler2D envMap, vec3 rayDirection ) {
				vec2 uvv = equirectUv( rayDirection );
				return texture( envMap, uvv );
			}
			void main() {
				mat4 modelMatrixInverse = inverse( modelMatrix );
				vec2 uv = gl_FragCoord.xy / resolution;
				vec3 normal = vNormal;
				vec3 rayOrigin = cameraPosition;
				vec3 rayDirection = normalize( vWorldPosition - cameraPosition );
				if ( aberrationStrength != 0.0 ) {
					// perform chromatic aberration lookups
					vec3 rayDirectionG = totalInternalReflection( rayOrigin, rayDirection, normal, max( ior, 1.0 ), modelMatrixInverse );
					vec3 rayDirectionR, rayDirectionB;
					if ( fastChroma ) {
						// fast chroma does a quick uv offset on lookup
						rayDirectionR = normalize( rayDirectionG + 1.0 * vec3( aberrationStrength / 2.0 ) );
						rayDirectionB = normalize( rayDirectionG - 1.0 * vec3( aberrationStrength / 2.0 ) );
					} else {
						// compared to a proper ray trace of diffracted rays
						float iorR = max( ior * ( 1.0 - aberrationStrength ), 1.0 );
						float iorB = max( ior * ( 1.0 + aberrationStrength ), 1.0 );
						rayDirectionR = totalInternalReflection(
							rayOrigin, rayDirection, normal,
							iorR, modelMatrixInverse
						);
						rayDirectionB = totalInternalReflection(
							rayOrigin, rayDirection, normal,
							iorB, modelMatrixInverse
						);
					}
					// get the color lookup
					float r = envSample( envMap, rayDirectionR ).r;
					float g = envSample( envMap, rayDirectionG ).g;
					float b = envSample( envMap, rayDirectionB ).b;
					gl_FragColor.rgb = vec3( r, g, b ) * color;
					gl_FragColor.a = 1.0;
				} else {
					// no chromatic aberration lookups
					rayDirection = totalInternalReflection( rayOrigin, rayDirection, normal, max( ior, 1.0 ), modelMatrixInverse );
					gl_FragColor.rgb = envSample( envMap, rayDirection ).rgb * color;
					gl_FragColor.a = 1.0;
				}
				#include <tonemapping_fragment>
				#include <colorspace_fragment>
			}
		`
		});
	}
}



