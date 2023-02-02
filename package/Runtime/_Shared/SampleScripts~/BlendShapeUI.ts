import { Behaviour, EventList, serializable, SkinnedMeshRenderer } from "@needle-tools/engine";

import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { Object3D } from "three";

// Documentation → https://docs.needle.tools/scripting

export class BlendShapeUI extends Behaviour {
    
    @serializable(String)
    public visibleBlendShapeNames?: Array<string>;

    start() {
        const smr = this.gameObject.getComponent(SkinnedMeshRenderer);
        const mesh = smr?.gameObject as Object3D;

        const gui = new GUI();

        for (let i = 0; i < mesh.morphTargetInfluences.length; i++)
        {
            const name = this.visibleBlendShapeNames?.[i] ?? `BlendShape ${i}`;
            gui.add(mesh.morphTargetInfluences, i, -1, 1).name(name).onChange((value) => mesh.morphTargetInfluences[i] = value);
        }
    }
}