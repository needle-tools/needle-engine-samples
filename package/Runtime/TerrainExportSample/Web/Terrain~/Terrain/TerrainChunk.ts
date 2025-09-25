import { Behaviour, serializable } from "@needle-tools/engine";
import * as THREE from "three";
import { createTerrainNodeMaterial } from "./CreateTerrainNodeMaterial";
import { createTerrainShaderMaterial } from "./CreateTerrainMaterial";


export class TerrainChunk extends Behaviour {
  @serializable() splatMap?: THREE.Texture;
  @serializable() baseMaps: THREE.Texture[] = [];
  @serializable() normalMaps: THREE.Texture[] = [];
  @serializable() offset: THREE.Vector2[] = [];
  @serializable() tiling: THREE.Vector2[] = [];

  private findTargetMesh(): THREE.Mesh | null {
    let found: THREE.Mesh | null = null;
    this.gameObject.traverse(obj => {
      if (found) return;
      const any = obj as any;
      if (any.isMesh) found = any as THREE.Mesh;
    });
    return found;
  }

  private async GetMaterial() : Promise<THREE.ShaderMaterial> {

    // Use GLSL shader material
    const material = await createTerrainShaderMaterial({
        splat: this.splatMap!,
        layers: [0,1,2,3].map(i => ({
            albedo: this.baseMaps[i],
            //normal: this.normalMaps[i],
            tiling: this.tiling[i] ?? new THREE.Vector2(1,1),
            offset: this.offset[i] ?? new THREE.Vector2(0,0),
      })) as any,
        opacity: 1
    });
    return material;


    // Or use Node-based material (uncomment to use)
    /*
    const mat = await createTerrainNodeMaterial({
      splat: this.splatMap!,
      layers: [0, 1, 2, 3].map(i => ({
        albedo: this.baseMaps[i],
        normal: this.normalMaps[i],
        tiling: this.tiling[i] ?? new THREE.Vector2(1, 1),
        offset: this.offset[i] ?? new THREE.Vector2(0, 0),
      })) as any,
      opacity: 1,
      roughness: 0.95,
      metalness: 0.0,
      clearcoat: 0.0,
      clearcoatRoughness: 0.0,
    });
    return mat;
    */   
  }

  async start() {
    if (this.splatMap) {
      this.splatMap.wrapS = this.splatMap.wrapT = THREE.ClampToEdgeWrapping;
    }

    const mesh = this.findTargetMesh();
    if (!mesh) {
      console.warn("TerrainChunkNode: No Mesh found under object", this.gameObject.name);
      return;
    }

    const ok = !!this.splatMap && this.baseMaps.length >= 4 && this.normalMaps.length >= 4 &&
      this.baseMaps.slice(0, 4).every(t => t) && this.normalMaps.slice(0, 4).every(t => t);
    if (!ok) {
      console.warn("TerrainChunkNode: Provide splat + at least 4 valid baseMaps and 4 valid normalMaps");
      return;
    }

    const mat = await this.GetMaterial();

    mesh.material = mat as any;
    mesh.receiveShadow = true;
  }
}
