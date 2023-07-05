// START MARKER Set Random Color
import { Behaviour, serializeable, Renderer } from "@needle-tools/engine";
import { Color } from "three";

export class RandomColor extends Behaviour {

    @serializeable()
    applyOnStart: boolean = true;

    start() {
        if (this.applyOnStart)
            this.applyRandomColor();

        // if materials are not cloned and we change the color they might also change on other objects
        const cloneMaterials = true;
        if (cloneMaterials) {
            const renderer = this.gameObject.getComponent(Renderer);
            if (!renderer) {
                return;
            }
            for (let i = 0; i < renderer.sharedMaterials.length; i++) {
                renderer.sharedMaterials[i] = renderer.sharedMaterials[i].clone();
            }
        }
    }

    applyRandomColor() {
        const renderer = this.gameObject.getComponent(Renderer);
        if (!renderer) {
            console.warn("Can not change color: No renderer on " + this.name);
            return;
        }
        for (let i = 0; i < renderer.sharedMaterials.length; i++) {
            renderer.sharedMaterials[i].color = new Color(Math.random(), Math.random(), Math.random());
        }
    }
}
// END MARKER Set Random Color