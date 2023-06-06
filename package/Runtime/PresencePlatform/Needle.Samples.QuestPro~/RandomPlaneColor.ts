import { Behaviour, Renderer, serializeable } from "@needle-tools/engine";
import { MeshStandardMaterial } from "three";

// Documentation → https://docs.needle.tools/scripting

export class RandomPlaneColor extends Behaviour {

    awake() {
        const r = this.gameObject.getComponent(Renderer);
        if (!r) return;

        const m = r.sharedMaterial.clone() as MeshStandardMaterial ;
        r.sharedMaterial = m;

        m.color.setHex(Math.random() * 0xffffff);
    }
}