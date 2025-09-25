import { Behaviour, serializable } from "@needle-tools/engine";
import * as THREE from "three";
import { createTerrainShaderMaterial } from "./CreateTerrainMaterial";

// Documentation → https://docs.needle.tools/scripting

export class TerrainChunk_ extends Behaviour {


    // Splat map and arrays for textures and per-layer parameters
    @serializable() splatMap?: THREE.Texture;
    @serializable() baseMaps: THREE.Texture[] = [];      // albedo textures
    @serializable() normalMaps: THREE.Texture[] = [];    // normal map textures
    @serializable() offset: THREE.Vector2[] = [ ];
    @serializable() tiling: THREE.Vector2[] = [ ];


    private findTargetMesh(): THREE.Mesh | null {
        let found: THREE.Mesh | null = null;
        this.gameObject.traverse(obj => {
            if (found) return;
            const any = obj as any;
            if (any.isMesh) found = any as THREE.Mesh;
        });
        return found;
    }

    async start() {

        // Set splatmap texture to clamp to edge to avoid seams
        if (this.splatMap) {
            this.splatMap.wrapS = this.splatMap.wrapT = THREE.ClampToEdgeWrapping;
        }

        const mesh = this.findTargetMesh();
        if (!mesh) {
            console.warn("TerrainChunk: No Mesh found under object", this.gameObject.name);
            return;
        }

        const ok = !!this.splatMap && this.baseMaps.length >= 4 && this.normalMaps.length >= 4 &&
            this.baseMaps.slice(0,4).every(t => t) && this.normalMaps.slice(0,4).every(t => t);
        if (!ok) {
            console.warn("TerrainChunk: Provide splat + at least 4 valid baseMaps and 4 valid normalMaps");
            return;
        }

        const material = await createTerrainShaderMaterial({
            splat: this.splatMap!,
            layers: [0,1,2,3].map(i => ({
                albedo: this.baseMaps[i],
                normal: this.normalMaps[i],
                tiling: this.tiling[i] ?? new THREE.Vector2(1,1),
                offset: this.offset[i] ?? new THREE.Vector2(0,0),
          })) as any,
            opacity: 1
        });

        

        mesh.material = material;
        mesh.receiveShadow = true;
    }
}