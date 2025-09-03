import { AxesHelper, Behaviour, getTempVector, Gizmos, serializable } from '@needle-tools/engine'
import {
    Color,
    DepthFormat,
    DepthTexture,
    FrontSide,
    LinearFilter,
    LinearMipmapLinearFilter,
    Matrix4,
    Mesh,
    PerspectiveCamera,
    Plane,
    PlaneGeometry,
    ShaderMaterial,
    Side,
    Texture,
    UniformsLib,
    UniformsUtils,
    UnsignedShortType,
    Vector3,
    Vector4,
    WebGLRenderTarget,
} from 'three'
// import { Water as _Water } from 'three/examples/jsm/objects/Water.js';


export class Water extends Behaviour {

    @serializable()
    resolution: number = 1024;

    @serializable()
    speed: number = .5;

    @serializable()
    distortionScale: number = 1;

    @serializable(Texture)
    waterNormals: Texture | null = null;

    @serializable(Color)
    waterColor: Color = new Color(1, 1, 1);

    @serializable()
    roughness: number = 0.5;

    private _water: _Water | null = null;


    onEnable(): void {
        const waterGeometry = new PlaneGeometry(1, 1);
        this._water = new _Water(waterGeometry, {
            textureWidth: this.resolution,
            textureHeight: this.resolution,
            waterNormals: this.waterNormals || undefined,
            waterColor: this.waterColor || undefined,
            roughness: this.roughness,
            fog: this.scene.fog ? true : false,
        });
        this._water.rotation.x = - Math.PI / 2;
        this._water.position.y += .0001;
        this.gameObject.add(this._water);

    }
    onDisable(): void {
        this._water?.destroy();
    }

    update() {
        if (this._water) {
            const mat = this._water.material as ShaderMaterial;

            mat.uniforms['time'].value += this.speed * this.context.time.deltaTime;
            if (this.context.mainLight) {
                const dir = getTempVector(0, 0, 1);
                dir.applyQuaternion(this.context.mainLight.gameObject.worldQuaternion);
                mat.uniforms['sunDirection'].value.copy(dir);
                mat.uniforms['sunColor'].value.copy(this.context.mainLight.color).multiplyScalar(this.context.mainLight.intensity);
            }
            mat.uniforms['distortionScale'].value = this.waterNormals ? this.distortionScale : 0;
            mat.uniforms["normalSampler"].value = this.distortionScale === 0 ? null : this.waterNormals;
            mat.uniforms['roughness'].value = this.roughness;
            mat.fog = this.scene.fog ? true : false;
        }
    }

}


type WaterOptions = {
    textureWidth?: number;
    textureHeight?: number;
    clipBias?: number;
    alpha?: number;
    time?: number;
    waterNormals?: Texture | null;
    sunDirection?: Vector3;
    sunColor?: Color;
    waterColor?: Color;
    eye?: Vector3;
    distortionScale?: number;
    roughness?: number;
    side?: Side;
    fog?: boolean;
}

// @dont-generate-component


/**
 * Work based on :
 * https://github.com/Slayvin: Flat mirror for three.js
 * https://home.adelphi.edu/~stemkoski/ : An implementation of water shader based on the flat mirror
 * http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Water shader explanations in WebGL
 */
class _Water extends Mesh {

    readonly isWater: boolean = true;

    constructor(geometry, options: WaterOptions = {}) {
        super(geometry)

        const scope = this

        const textureWidth = options.textureWidth !== undefined ? options.textureWidth : 512
        const textureHeight = options.textureHeight !== undefined ? options.textureHeight : 512

        const clipBias = options.clipBias !== undefined ? options.clipBias : 0.0
        const alpha = options.alpha !== undefined ? options.alpha : 1.0
        const time = options.time !== undefined ? options.time : 0.0
        const normalSampler = options.waterNormals ? options.waterNormals : null
        const sunDirection = options.sunDirection !== undefined ? options.sunDirection : new Vector3(0.70707, 0.70707, 0.0)
        const sunColor = new Color(options.sunColor !== undefined ? options.sunColor : 0xffffff)
        const waterColor = new Color(options.waterColor !== undefined ? options.waterColor : 0xdddddd)
        const eye = options.eye !== undefined ? options.eye : new Vector3(0, 0, 0)
        const distortionScale = options.distortionScale !== undefined ? options.distortionScale : normalSampler ? 1 : 0
        const roughness = options.roughness !== undefined ? options.roughness : 0.5
        const side: Side = options.side !== undefined ? options.side : FrontSide
        const fog = options.fog !== undefined ? options.fog : false

        //

        const mirrorPlane = new Plane()
        const normal = new Vector3()
        const mirrorWorldPosition = new Vector3()
        const cameraWorldPosition = new Vector3()
        const rotationMatrix = new Matrix4()
        const lookAtPosition = new Vector3(0, 0, -1)
        const clipPlane = new Vector4()

        const view = new Vector3()
        const target = new Vector3()
        const q = new Vector4()

        const textureMatrix = new Matrix4()

        const mirrorCamera = new PerspectiveCamera()

        const renderTarget = new WebGLRenderTarget(textureWidth, textureHeight)
        renderTarget.texture.generateMipmaps = true
        renderTarget.texture.minFilter = LinearMipmapLinearFilter
        renderTarget.texture.magFilter = LinearFilter
        

        const mirrorShader = {
            uniforms: UniformsUtils.merge([
                UniformsLib['fog'],
                UniformsLib['lights'],
                {
                    normalSampler: { value: null },
                    mirrorSampler: { value: null },
                    alpha: { value: 1.0 },
                    time: { value: 0.0 },
                    size: { value: 1.0 },
                    distortionScale: { value: 20.0 },
                    textureMatrix: { value: new Matrix4() },
                    sunColor: { value: new Color(0x7f7f7f) },
                    sunDirection: { value: new Vector3(0.70707, 0.70707, 0) },
                    eye: { value: new Vector3() },
                    waterColor: { value: new Color(0x555555) },
                    roughness: { value: 0.5 },
                },
            ]),

            vertexShader: /* glsl */ `
				uniform mat4 textureMatrix;
				uniform float time;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				#include <common>
				#include <fog_pars_vertex>
				#include <shadowmap_pars_vertex>
				#include <logdepthbuf_pars_vertex>

				void main() {
					mirrorCoord = modelMatrix * vec4( position, 1.0 );
					worldPosition = mirrorCoord.xyzw;
					mirrorCoord = textureMatrix * mirrorCoord;
					vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );
					gl_Position = projectionMatrix * mvPosition;

				#include <beginnormal_vertex>
				#include <defaultnormal_vertex>
				#include <logdepthbuf_vertex>
				#include <fog_vertex>
				#include <shadowmap_vertex>
			}`,

            fragmentShader: `				
				uniform sampler2D mirrorSampler;
				uniform float alpha;
				uniform float time;
				uniform float size;
				uniform float distortionScale;
				uniform sampler2D normalSampler;
				uniform vec3 sunColor;
				uniform vec3 sunDirection;
				uniform vec3 eye;
				uniform vec3 waterColor;
				uniform float roughness;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				vec4 getNoise( vec2 uv ) {
					vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
					vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
					vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
					vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
					vec4 noise = texture2D( normalSampler, uv0 ) +
						texture2D( normalSampler, uv1 ) +
						texture2D( normalSampler, uv2 ) +
						texture2D( normalSampler, uv3 );
					return noise * 0.5 - 1.0;
				}

				void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float roughness, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
					vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
					float direction = max( 0.0, dot( eyeDirection, reflection ) );
					
					// Convert roughness to shininess (inverse relationship)
					float shininess = mix( 1000.0, 1.0, roughness );
					
					specularColor += pow( direction, shininess ) * sunColor * spec;
					diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
				}

				#include <common>
				#include <packing>
				#include <bsdfs>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <lights_pars_begin>
				#include <shadowmap_pars_fragment>
				#include <shadowmask_pars_fragment>

				void main() {

					#include <logdepthbuf_fragment>
					vec4 noise = getNoise( worldPosition.xz * size );
					vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

					vec3 diffuseLight = vec3(0.0);
					vec3 specularLight = vec3(0.0);

					vec3 worldToEye = eye-worldPosition.xyz;
					vec3 eyeDirection = normalize( worldToEye );
					sunLight( surfaceNormal, eyeDirection, roughness, 2.0, 0.5, diffuseLight, specularLight );

					float distance = length(worldToEye);

					vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
					
					// Sample reflection with high-quality multi-sampling
					vec2 reflectCoord = mirrorCoord.xy / mirrorCoord.w + distortion;
					vec3 reflectionSample = vec3(0.0);
					
					if (roughness < 0.01) {
						// Sharp reflection for smooth surfaces
						reflectionSample = texture2D( mirrorSampler, reflectCoord ).rgb;
					} else {
						// Ultra high-quality 25-tap sampling with roughness-based blur
						float blurRadius = roughness * 0.03;
						
						// Add noise jittering to break up patterns
						vec2 noiseOffset = (noise.xy * 2.0 - 1.0) * blurRadius * 0.25;
						
						// Extended Poisson disk sample offsets for ultra-smooth blur
						vec2 offsets[24];
						offsets[0] = vec2(0.0, 0.0);
						offsets[1] = vec2(0.54, 0.0);
						offsets[2] = vec2(0.16, 0.52);
						offsets[3] = vec2(-0.44, 0.28);
						offsets[4] = vec2(-0.38, -0.44);
						offsets[5] = vec2(0.13, -0.51);
						offsets[6] = vec2(0.79, -0.13);
						offsets[7] = vec2(-0.24, 0.11);
						offsets[8] = vec2(0.24, 0.27);
						offsets[9] = vec2(-0.06, -0.22);
						offsets[10] = vec2(0.4, -0.35);
						offsets[11] = vec2(-0.67, -0.05);
						offsets[12] = vec2(0.87, 0.28);
						offsets[13] = vec2(-0.85, 0.33);
						offsets[14] = vec2(0.29, -0.84);
						offsets[15] = vec2(-0.31, -0.81);
						offsets[16] = vec2(0.73, 0.71);
						offsets[17] = vec2(-0.72, -0.68);
						offsets[18] = vec2(-0.77, 0.64);
						offsets[19] = vec2(0.68, -0.76);
						offsets[20] = vec2(0.91, -0.51);
						offsets[21] = vec2(-0.93, -0.26);
						offsets[22] = vec2(0.15, 0.94);
						offsets[23] = vec2(-0.19, -0.97);
						
						// Hybrid sampling: LOD for base blur + regular for detail
						float baseMipLevel = roughness * 4.0;
						
						// Center sample uses LOD for base blur quality
						reflectionSample += texture2DLodEXT( mirrorSampler, reflectCoord + noiseOffset, baseMipLevel ).rgb * 0.3;
						
						// Inner ring: mix of LOD and regular sampling
						for (int i = 1; i < 12; i++) {
							vec2 sampleCoord = reflectCoord + offsets[i] * blurRadius + noiseOffset * 0.4;
							if (i % 3 == 0) {
								// Every 3rd sample uses LOD for smooth base
								reflectionSample += texture2DLodEXT( mirrorSampler, sampleCoord, baseMipLevel * 0.7 ).rgb * 0.04;
							} else {
								// Regular samples for detail
								reflectionSample += texture2D( mirrorSampler, sampleCoord ).rgb * 0.035;
							}
						}
						
						// Outer ring: mostly regular sampling with occasional LOD
						for (int i = 12; i < 24; i++) {
							vec2 sampleCoord = reflectCoord + offsets[i] * blurRadius + noiseOffset * 0.3;
							if (i % 4 == 0) {
								// Every 4th sample uses higher LOD for distant blur
								reflectionSample += texture2DLodEXT( mirrorSampler, sampleCoord, baseMipLevel ).rgb * 0.02;
							} else {
								// Regular samples for sharp detail
								reflectionSample += texture2D( mirrorSampler, sampleCoord ).rgb * 0.015;
							}
						}
					}

					float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
					float rf0 = mix(0.02, 0.3, roughness); // Rougher surfaces have higher base reflectance
					float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
					vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
					vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
					vec3 outgoingLight = albedo;
					gl_FragColor = vec4( outgoingLight, alpha );

					#include <tonemapping_fragment>
					#include <colorspace_fragment>
					#include <fog_fragment>
				}`,
        }

        const material = new ShaderMaterial({
            fragmentShader: mirrorShader.fragmentShader,
            vertexShader: mirrorShader.vertexShader,
            uniforms: UniformsUtils.clone(mirrorShader.uniforms),
            lights: true,
            side: side,
            fog: fog,
        })

        material.uniforms['mirrorSampler'].value = renderTarget.texture
        material.uniforms['textureMatrix'].value = textureMatrix
        material.uniforms['alpha'].value = alpha
        material.uniforms['time'].value = time
        material.uniforms['normalSampler'].value = normalSampler
        material.uniforms['sunColor'].value = sunColor
        material.uniforms['waterColor'].value = waterColor
        material.uniforms['sunDirection'].value = sunDirection
        material.uniforms['distortionScale'].value = distortionScale
        material.uniforms['roughness'].value = roughness

        material.uniforms['eye'].value = eye

        scope.material = material;

        // modify code
        material.onBeforeCompile = function (shader) {
           // enable texture2DLodEXT by defining it as textureLod
           shader.fragmentShader = '#define texture2DLodEXT textureLod\n' + shader.fragmentShader;
        };

        scope.onBeforeRender = function (renderer, scene, camera) {
            mirrorWorldPosition.setFromMatrixPosition(scope.matrixWorld)
            cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld)

            rotationMatrix.extractRotation(scope.matrixWorld)

            normal.set(0, 0, 1)
            normal.applyMatrix4(rotationMatrix)

            view.subVectors(mirrorWorldPosition, cameraWorldPosition)

            // Avoid rendering when mirror is facing away

            if (view.dot(normal) > 0) return

            view.reflect(normal).negate()
            view.add(mirrorWorldPosition)

            rotationMatrix.extractRotation(camera.matrixWorld)

            lookAtPosition.set(0, 0, -1)
            lookAtPosition.applyMatrix4(rotationMatrix)
            lookAtPosition.add(cameraWorldPosition)

            target.subVectors(mirrorWorldPosition, lookAtPosition)
            target.reflect(normal).negate()
            target.add(mirrorWorldPosition)

            mirrorCamera.position.copy(view)
            mirrorCamera.up.set(0, 1, 0)
            mirrorCamera.up.applyMatrix4(rotationMatrix)
            mirrorCamera.up.reflect(normal)
            mirrorCamera.lookAt(target)

            if (camera instanceof PerspectiveCamera)
                mirrorCamera.far = camera.far // Used in WebGLBackground

            mirrorCamera.updateMatrixWorld()
            mirrorCamera.projectionMatrix.copy(camera.projectionMatrix)

            // Update the texture matrix
            textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0)
            textureMatrix.multiply(mirrorCamera.projectionMatrix)
            textureMatrix.multiply(mirrorCamera.matrixWorldInverse)

            // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
            // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
            mirrorPlane.setFromNormalAndCoplanarPoint(normal, mirrorWorldPosition)
            mirrorPlane.applyMatrix4(mirrorCamera.matrixWorldInverse)

            clipPlane.set(mirrorPlane.normal.x, mirrorPlane.normal.y, mirrorPlane.normal.z, mirrorPlane.constant)

            const projectionMatrix = mirrorCamera.projectionMatrix

            q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0]
            q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5]
            q.z = -1.0
            q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14]

            // Calculate the scaled plane vector
            clipPlane.multiplyScalar(2.0 / clipPlane.dot(q))

            // Replacing the third row of the projection matrix
            projectionMatrix.elements[2] = clipPlane.x
            projectionMatrix.elements[6] = clipPlane.y
            projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias
            projectionMatrix.elements[14] = clipPlane.w

            eye.setFromMatrixPosition(camera.matrixWorld)

            // Render

            const currentRenderTarget = renderer.getRenderTarget()

            const currentXrEnabled = renderer.xr.enabled
            const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate

            scope.visible = false

            renderer.xr.enabled = false // Avoid camera modification and recursion
            renderer.shadowMap.autoUpdate = false // Avoid re-computing shadows

            renderer.setRenderTarget(renderTarget)

            renderer.state.buffers.depth.setMask(true) // make sure the depth buffer is writable so it can be properly cleared, see #18897

            if (renderer.autoClear === false) renderer.clear()
            renderer.render(scene, mirrorCamera)
            
            // Generate mipmaps for roughness-based blur
            // renderer.generateMipmaps(renderTarget.texture)

            scope.visible = true

            renderer.xr.enabled = currentXrEnabled
            renderer.shadowMap.autoUpdate = currentShadowAutoUpdate

            renderer.setRenderTarget(currentRenderTarget)

            // Restore viewport

            const viewport = camera.viewport

            if (viewport !== undefined) {
                renderer.state.viewport(viewport)
            }
        }
    }
}
