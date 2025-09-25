import * as THREE from "three";
import type { TerrainLayer, TerrainMaterialOptions } from "./CreateTerrainMaterial";
import { uniform, add, mul, div, float, max, texture, normalMap, normalize, uv, MeshPhysicalNodeMaterial } from "three";

export type TerrainNodeMaterialOptions = TerrainMaterialOptions & {
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
};

function vec2(value?: THREE.Vector2 | [number, number]) {
  const v = value ? (Array.isArray(value) ? new THREE.Vector2(value[0], value[1]) : value) : new THREE.Vector2(1, 1);
  return v;
}

function setRepeat(t: THREE.Texture) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function prepAlbedo(tex: THREE.Texture, anisotropy?: number) {
  setRepeat(tex);
  if (anisotropy) tex.anisotropy = anisotropy;
  if ((THREE as any).SRGBColorSpace !== undefined) (tex as any).colorSpace = (THREE as any).SRGBColorSpace;
  else if ((tex as any).encoding !== undefined) (tex as any).encoding = (THREE as any).sRGBEncoding;
  return tex;
}

function prepNormal(tex: THREE.Texture, anisotropy?: number) {
  setRepeat(tex);
  if (anisotropy) tex.anisotropy = anisotropy;
  return tex;
}

export async function createTerrainNodeMaterial(options: TerrainNodeMaterialOptions): Promise<any /* MeshPhysicalNodeMaterial */> {
  const { splat, layers, opacity = 1, anisotropy, roughness = 0.9, metalness = 0.0, clearcoat = 0.0, clearcoatRoughness = 0.0 } = options;

  // Prepare textures
  const splatMap = splat; // caller may set clamp; uv tiling will be on layers

  const a0 = prepAlbedo(layers[0].albedo, anisotropy);
  const a1 = prepAlbedo(layers[1].albedo, anisotropy);
  const a2 = prepAlbedo(layers[2].albedo, anisotropy);
  const a3 = prepAlbedo(layers[3].albedo, anisotropy);

  const n0 = prepNormal(layers[0].normal, anisotropy);
  const n1 = prepNormal(layers[1].normal, anisotropy);
  const n2 = prepNormal(layers[2].normal, anisotropy);
  const n3 = prepNormal(layers[3].normal, anisotropy);

  // Nodes
  const uvc = uv();

  const tiling0 = uniform(vec2(layers[0].tiling));
  const tiling1 = uniform(vec2(layers[1].tiling));
  const tiling2 = uniform(vec2(layers[2].tiling));
  const tiling3 = uniform(vec2(layers[3].tiling));

  const offset0 = uniform(vec2(layers[0].offset ?? [0, 0]));
  const offset1 = uniform(vec2(layers[1].offset ?? [0, 0]));
  const offset2 = uniform(vec2(layers[2].offset ?? [0, 0]));
  const offset3 = uniform(vec2(layers[3].offset ?? [0, 0]));

  const uv0 = add(mul(uvc, tiling0), offset0);
  const uv1 = add(mul(uvc, tiling1), offset1);
  const uv2 = add(mul(uvc, tiling2), offset2);
  const uv3 = add(mul(uvc, tiling3), offset3);

  const splatTex = texture(splatMap, uvc);

  // Normalize weights so r+g+b+a = 1
  const sum = add(add(splatTex.r, splatTex.g), add(splatTex.b, splatTex.a));
  const invSum = div(float(1.0), max(sum, float(1e-5)));
  const wR = mul(splatTex.r, invSum);
  const wG = mul(splatTex.g, invSum);
  const wB = mul(splatTex.b, invSum);
  const wA = mul(splatTex.a, invSum);

  // Albedo blend
  const c0 = texture(a0, uv0).rgb;
  const c1 = texture(a1, uv1).rgb;
  const c2 = texture(a2, uv2).rgb;
  const c3 = texture(a3, uv3).rgb;

  const baseColor = add(
    add(mul(c0, wR), mul(c1, wG)),
    add(mul(c2, wB), mul(c3, wA))
  );

  // Normal map blend (view-space normals using node helper)
  // Use normalMap() helper which applies TBN and derivative logic internally
  const nm0 = normalMap(texture(n0, uv0));
  const nm1 = normalMap(texture(n1, uv1));
  const nm2 = normalMap(texture(n2, uv2));
  const nm3 = normalMap(texture(n3, uv3));

  const blendedNormalView = normalize(
    add(
      add(mul(nm0, wR), mul(nm1, wG)),
      add(mul(nm2, wB), mul(nm3, wA))
    )
  );

  // Build material
  const mat = new MeshPhysicalNodeMaterial();

  mat.colorNode = baseColor; // base color (albedo)
  mat.normalNode = blendedNormalView; // view-space normal

  mat.roughnessNode = float(roughness);
  mat.metalnessNode = float(metalness);
  mat.clearcoatNode = float(clearcoat);
  mat.clearcoatRoughnessNode = float(clearcoatRoughness);

  if (opacity < 1) {
    mat.transparent = true;
    mat.opacityNode = float(opacity);
    mat.depthWrite = false;
  } else {
    mat.transparent = false;
    mat.opacityNode = float(1);
    mat.depthWrite = true;
  }

  mat.lights = true;
  mat.fog = true;
  mat.needsUpdate = true;   

  // Lighting, fog, env are handled by MeshPhysicalNodeMaterial
  return mat;
}

export async function applyTerrainNodeMaterial(mesh: THREE.Mesh, options: TerrainNodeMaterialOptions) {
  const mat = await createTerrainNodeMaterial(options);
  mesh.material = mat as any;
  // mesh.receiveShadow = true;
}

// Example usage (same textures as in CreateTerrainMaterial):
// import { createTerrainNodeMaterial } from './CreateTerrainNodeMaterial';
// mesh.material = await createTerrainNodeMaterial({
//   splat,
//   layers: [
//     { albedo: albedo0, normal: normal0, tiling: [8,8], offset: [0,0] },
//     { albedo: albedo1, normal: normal1, tiling: [6,6], offset: [0,0] },
//     { albedo: albedo2, normal: normal2, tiling: [4,4], offset: [0,0] },
//     { albedo: albedo3, normal: normal3, tiling: [10,10], offset: [0,0] },
//   ],
//   opacity: 1,
//   roughness: 0.95,
//   metalness: 0.0,
// });
