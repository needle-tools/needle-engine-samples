import { Behaviour, serializable } from "@needle-tools/engine";
import { Material } from "three";

export class WireframeMaterial extends Behaviour {
    @serializable(Material)
    material?: Material;

    awake() {
        if(!this.material) return;

        this.material["wireframe"] = true;
    }
}