import { Behaviour, Collider, Renderer } from "@needle-tools/engine";
import { Color } from "three"


export class ChangeColorOnCollision extends Behaviour {

    start() {
        const renderer = this.gameObject.getComponent(Renderer);
        if (!renderer) {
            return;
        }
        for (let i = 0; i < renderer.sharedMaterials.length; i++) {
            renderer.sharedMaterials[i] = renderer.sharedMaterials[i].clone();
        }
    }

    onCollisionEnter(_col: Collider) {
        const renderer = this.gameObject.getComponent(Renderer);
        if (!renderer) {
            return;
        }
        for (let i = 0; i < renderer.sharedMaterials.length; i++) {
            renderer.sharedMaterials[i].color = new Color(Math.random(), Math.random(), Math.random());
        }
    }
}