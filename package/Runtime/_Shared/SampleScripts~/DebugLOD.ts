import { Behaviour, LODGroup, Text, serializable } from "@needle-tools/engine";
import { Vector3, LOD, Mesh} from "three";

export class DebugLOD extends Behaviour {

    @serializable(LODGroup)
    lodGroup?: LODGroup;

    @serializable(Text)
    text?: Text;

    private tempVec1 = new Vector3();
    private tempVec2 = new Vector3();
    update(): void {
        if(!this.lodGroup || !this.text) return;

        const cam = this.context.mainCamera as THREE.PerspectiveCamera;
        
        cam.getWorldPosition(this.tempVec1);
        this.gameObject.getWorldPosition(this.tempVec2);
        const dist = this.tempVec1.distanceTo(this.tempVec2) / cam.zoom;

        const handlers = this.lodGroup["_lodsHandler"] as Array<LOD>;
        let msg: string | null = null;
        handlers?.forEach((lod) => { 
            const lowerLvl = lod.levels[lod.getCurrentLevel()]!;
            const upperLvl = lod.levels.at(lod.getCurrentLevel() + 1);
            let stats: string | null = null;
            if(lowerLvl.object instanceof Mesh) {
                const attributes = lowerLvl.object.geometry.attributes;
                const vertexCount = Math.floor(attributes.position?.count || 0);
                const triangleCount = Math.floor((attributes.index?.count || vertexCount) / 3);
                stats = `Triangles: ${triangleCount}, Vertices: ${vertexCount}`;
            }

            const name = lowerLvl.object.name.replace(/_/g, "");
            if(!lowerLvl.object.name.includes("Cull")) {
                msg = "";
                if(stats)
                    msg += `${stats}\n`;

                const hysteresis = upperLvl?.hysteresis ?? 0;
                
                msg += `${lowerLvl.distance.toFixed(1)} / ${dist.toFixed(1)}`;
                if(upperLvl)
                    msg += ` / ${(upperLvl.distance - (upperLvl.distance * upperLvl.hysteresis)).toFixed(1)}`;

            }
        });

        if(!msg)
            msg = "culled";

        this.text!.text = msg;
    }
}