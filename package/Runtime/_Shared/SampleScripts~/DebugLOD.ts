import { Behaviour, LODGroup, Text, serializable } from "@needle-tools/engine";
import { Vector3, LOD } from "three";

export class DebugLOD extends Behaviour {

    @serializable(LODGroup)
    lodGroup?: LODGroup;

    @serializable(Text)
    text?: Text;

    private tempVec1 = new Vector3();
    private tempVec2 = new Vector3();
    update(): void {
        if(!this.lodGroup || !this.text) return;

        this.context.mainCamera!.getWorldPosition(this.tempVec1);
        this.gameObject.getWorldPosition(this.tempVec2);
        const dist = this.tempVec1.distanceTo(this.tempVec2);

        const handlers = this.lodGroup["_lodsHandler"] as Array<LOD>;
        if(handlers) {
            let msg: string | null = null;
            handlers.forEach((lod) => { 
                const lvl = lod.levels[lod.getCurrentLevel()]!;
                if(!lvl.object.name.includes("Cull")) {
                    msg = `${lvl.object.name.replace(/_/g, " ")}\n${lvl.distance.toFixed(2)}`;
                }
            })

            if(!msg)
                msg = ` \nculled`;

            this.text!.text = `${msg}\n${dist.toFixed(2)}`;
        }
    }
}