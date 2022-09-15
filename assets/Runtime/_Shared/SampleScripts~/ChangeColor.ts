import { Behaviour } from "@needle-tools/engine";
import { Renderer } from "@needle-tools/engine/engine-components/Renderer";
import { Color } from "three";

export class RandomColor extends Behaviour {
    start() {
        this.applyRandomColor();
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