import * as THREE from "three";
import { shaderVert, shaderFrag } from "./terrain.glsl.js";
import { UniformsLib, UniformsUtils } from "three";

export class CustomShaderMaterial extends THREE.ShaderMaterial {
  public isMeshStandardMaterial: boolean = true;
  public isMeshLambertMaterial: boolean = true;
  public envMapRotation: THREE.Euler = new THREE.Euler();
  
  // Environment properties
  public envMap: THREE.Texture | null = null;
  public envMapIntensity: number = 1.0;
  
  constructor(parameters?: THREE.ShaderMaterialParameters) {
    super(parameters);
    
    // Initialize environment properties
    this.envMap = null;
    this.envMapIntensity = 1.0;
    this.envMapRotation = new THREE.Euler();
  }
  
  // Method to update environment parameters
  updateEnvironment(envMap: THREE.Texture | null, intensity: number = 1.0, rotation?: THREE.Euler) {
    this.envMap = envMap;
    this.envMapIntensity = intensity;
    if (rotation) this.envMapRotation.copy(rotation);
    
    // Update uniforms
    if (this.uniforms) {
      if (this.uniforms.envMap) this.uniforms.envMap.value = envMap;
      if (this.uniforms.envMapIntensity) this.uniforms.envMapIntensity.value = intensity;
      if (this.uniforms.envMapRotation) this.uniforms.envMapRotation.value = this.envMapRotation;
    }
    
    this.needsUpdate = true;
  }
}

export type TerrainLayer = {
  albedo: THREE.Texture;
  normal: THREE.Texture;
  tiling?: THREE.Vector2 | [number, number];
  offset?: THREE.Vector2 | [number, number];
};

export type TerrainMaterialOptions = {
  splat: THREE.Texture;
  layers: [TerrainLayer, TerrainLayer, TerrainLayer, TerrainLayer];
  opacity?: number;
  anisotropy?: number;
  // Environment parameters
  envMap?: THREE.Texture | null;
  envMapIntensity?: number;
  envMapRotation?: THREE.Euler;
  // Additional material properties
  roughness?: number;
  metalness?: number;
  emissive?: THREE.Color | [number, number, number];
};

export async function createTerrainShaderMaterial(options: TerrainMaterialOptions): Promise<CustomShaderMaterial> {
  const { 
    splat, 
    layers, 
    opacity = 1, 
    anisotropy, 
    envMap = null, 
    envMapIntensity = 1.0, 
    envMapRotation,
    roughness = 0.8,
    metalness = 0.0,
    emissive = [0, 0, 0]
  } = options;

  console.log("Creating terrain material with options:", options);

  const setRepeat = (t: THREE.Texture) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };

  // Prepare provided textures
  const splatMap = setRepeat(splat);
  const prepAlbedo = (tex: THREE.Texture) => {
    setRepeat(tex);
    if (anisotropy) tex.anisotropy = anisotropy;
    // Three r152+: use colorSpace, older: encoding
    if ((THREE as any).SRGBColorSpace !== undefined) (tex as any).colorSpace = (THREE as any).SRGBColorSpace;
    else if ((tex as any).encoding !== undefined) (tex as any).encoding = (THREE as any).sRGBEncoding;
    return tex;
  };
  /*const prepNormal = (tex: THREE.Texture) => {
    setRepeat(tex);
    if (anisotropy) tex.anisotropy = anisotropy;
    return tex;
  };*/

  const [a0, a1, a2, a3] = [
    prepAlbedo(layers[0].albedo),
    prepAlbedo(layers[1].albedo),
    prepAlbedo(layers[2].albedo),
    prepAlbedo(layers[3].albedo),
  ];
/*   const [n0, n1, n2, n3] = [
    prepNormal(layers[0].normal),
    prepNormal(layers[1].normal),
    prepNormal(layers[2].normal),
    prepNormal(layers[3].normal),
  ]; */

  const uv = (v?: THREE.Vector2 | [number, number]) => v ? (Array.isArray(v) ? new THREE.Vector2(v[0], v[1]) : v) : new THREE.Vector2(1, 1);
  const ns = (v?: THREE.Vector2 | [number, number]) => v ? (Array.isArray(v) ? new THREE.Vector2(v[0], v[1]) : v) : new THREE.Vector2(1, 1);


  const uniforms: Record<string, THREE.IUniform> = {
  
    splatMap: { value: splatMap },

    albedo0: { value: a0 },
    albedo1: { value: a1 },
    albedo2: { value: a2 },
    albedo3: { value: a3 },
/* 
    normal0: { value: n0 },
    normal1: { value: n1 },
    normal2: { value: n2 },
    normal3: { value: n3 }, */

    tiling0: { value: uv(layers[0].tiling) },
    tiling1: { value: uv(layers[1].tiling ) },
    tiling2: { value: uv(layers[2].tiling) },
    tiling3: { value: uv(layers[3].tiling) },

    offset0: { value: uv(layers[0].offset) },
    offset1: { value: uv(layers[1].offset ) },
    offset2: { value: uv(layers[2].offset) },
    offset3: { value: uv(layers[3].offset) },

    opacity: { value: opacity },
    envMapIntensity: { value: envMapIntensity },
    roughness: { value: roughness },
    metalness: { value: metalness },
    emissive: { value: Array.isArray(emissive) ? new THREE.Color(...emissive) : emissive }
  };

  const mergedUniforms = UniformsUtils.merge([
    UniformsLib['common'],
    UniformsLib['fog'],
    UniformsLib['lights'],
    UniformsLib['envmap'],
    uniforms
  ]);

  const mat = new CustomShaderMaterial({
    vertexShader: shaderVert,
    fragmentShader: shaderFrag,
    uniforms: mergedUniforms,
    lights: true,
    fog: true,
    transparent: opacity < 1,
    depthWrite: opacity >= 1,
  });

  // Set environment parameters
  mat.envMap = envMap;
  mat.envMapIntensity = envMapIntensity;
  if (envMapRotation) mat.envMapRotation.copy(envMapRotation);

  mat.uniformsNeedUpdate = true;
  return mat;
}

export async function applyTerrainMaterial(mesh: THREE.Mesh, options: TerrainMaterialOptions) {
  const mat = await createTerrainShaderMaterial(options);
  mesh.material = mat;
  mesh.receiveShadow = true;
}

// Utility function to update environment parameters at runtime
export function updateMaterialEnvironment(
  material: CustomShaderMaterial, 
  envMap?: THREE.Texture | null,
  intensity?: number,
  rotation?: THREE.Euler
) {
  if (envMap !== undefined) {
    material.envMap = envMap;
    if (material.uniforms?.envMap) {
      material.uniforms.envMap.value = envMap;
    }
  }
  
  if (intensity !== undefined) {
    material.envMapIntensity = intensity;
    if (material.uniforms?.envMapIntensity) {
      material.uniforms.envMapIntensity.value = intensity;
    }
  }
  
  if (rotation) {
    material.envMapRotation.copy(rotation);
    if (material.uniforms?.envMapRotation) {
      material.uniforms.envMapRotation.value = material.envMapRotation;
    }
  }
  
  material.needsUpdate = true;
}

// Helper function to create environment maps from HDR or cube textures
export function setupEnvironmentMap(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  envTexture: THREE.Texture | THREE.CubeTexture
): THREE.Texture {
  if (envTexture instanceof THREE.CubeTexture) {
    scene.environment = envTexture;
    return envTexture as unknown as THREE.Texture;
  } else {
    // For HDR equirectangular textures, you might want to convert to cube map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
    pmremGenerator.dispose();
    scene.environment = envMap;
    return envMap;
  }
}

// Animation helper for dynamic environment updates
export class EnvironmentAnimator {
  private materials: CustomShaderMaterial[] = [];
  private time: number = 0;
  
  constructor(materials: CustomShaderMaterial | CustomShaderMaterial[]) {
    this.materials = Array.isArray(materials) ? materials : [materials];
  }
  
  // Add more materials to animate
  addMaterial(material: CustomShaderMaterial) {
    this.materials.push(material);
  }
  
  // Update function to call in your render loop
  update(deltaTime: number) {
    this.time += deltaTime;
    
    this.materials.forEach(material => {
      // Example: Oscillate environment intensity
      const intensity = 0.5 + 0.5 * Math.sin(this.time * 0.5);
      updateMaterialEnvironment(material, undefined, intensity);
      
      // Example: Rotate environment map over time
      const rotation = new THREE.Euler(0, this.time * 0.1, 0);
      updateMaterialEnvironment(material, undefined, undefined, rotation);
    });
  }
  
  // Set custom animation function
  setCustomAnimation(animationFn: (time: number, materials: CustomShaderMaterial[]) => void) {
    this.customAnimation = animationFn;
  }
  
  private customAnimation?: (time: number, materials: CustomShaderMaterial[]) => void;
  
  updateWithCustom(deltaTime: number) {
    this.time += deltaTime;
    if (this.customAnimation) {
      this.customAnimation(this.time, this.materials);
    }
  }
}

/*
Example usage:

import * as THREE from 'three';
import { createTerrainShaderMaterial, updateMaterialEnvironment, setupEnvironmentMap } from './CreateTerrainMaterial';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

async function setup(mesh: THREE.Mesh, renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  const tl = new THREE.TextureLoader();
  const hdrLoader = new RGBELoader();
  const anisotropy = renderer.capabilities.getMaxAnisotropy();

  // Load textures
  const splat = await tl.loadAsync('/assets/textures/splat.png');
  const albedo0 = await tl.loadAsync('/tex/grass_albedo.jpg');
  const normal0 = await tl.loadAsync('/tex/grass_normal.png');
  const albedo1 = await tl.loadAsync('/tex/dirt_albedo.jpg');
  const normal1 = await tl.loadAsync('/tex/dirt_normal.png');
  const albedo2 = await tl.loadAsync('/tex/rock_albedo.jpg');
  const normal2 = await tl.loadAsync('/tex/rock_normal.png');
  const albedo3 = await tl.loadAsync('/tex/sand_albedo.jpg');
  const normal3 = await tl.loadAsync('/tex/sand_normal.png');
  
  // Load HDR environment map
  const hdrTexture = await hdrLoader.loadAsync('/assets/hdri/environment.hdr');
  const envMap = setupEnvironmentMap(renderer, scene, hdrTexture);

  // Create material with environment parameters
  const material = await createTerrainShaderMaterial({
    splat,
    layers: [
      { albedo: albedo0, normal: normal0, tiling: [8,8], offset: [0,0] },
      { albedo: albedo1, normal: normal1, tiling: [6,6], offset: [0,0] },
      { albedo: albedo2, normal: normal2, tiling: [4,4], offset: [0,0] },
      { albedo: albedo3, normal: normal3, tiling: [10,10], offset: [0,0] },
    ],
    opacity: 1,
    anisotropy,
    // Environment parameters
    envMap: envMap,
    envMapIntensity: 1.0,
    envMapRotation: new THREE.Euler(0, Math.PI * 0.25, 0), // Rotate env map
    roughness: 0.7,
    metalness: 0.1,
    emissive: [0.01, 0.01, 0.02] // Slight blue emission
  });

  mesh.material = material;
  mesh.receiveShadow = true;
  
  // Example of updating environment at runtime
  setTimeout(() => {
    updateMaterialEnvironment(material, envMap, 1.5, new THREE.Euler(0, Math.PI * 0.5, 0));
  }, 5000);
}

// Example of creating a simple cube environment map
function createSimpleCubeEnvMap(renderer: THREE.WebGLRenderer): THREE.CubeTexture {
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
  const cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
  
  // You would render your scene from 6 directions here
  // This is a simplified example
  return cubeRenderTarget.texture;
}
*/
