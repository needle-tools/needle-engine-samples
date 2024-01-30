// START MARKER Set Random Color
import { Behaviour, serializeable, Renderer, InstancingUtil } from "@needle-tools/engine";
import { Color, MeshBasicMaterial, MeshStandardMaterial } from "three";

export class RandomColor extends Behaviour {

    @serializeable()
    applyOnStart: boolean = true;

    @serializeable()
    randomMetallicRoughness: boolean = true;

    start() {
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

        if (this.applyOnStart)
            this.applyRandomColor();
    }

    applyRandomColor() {
        const renderer = this.gameObject.getComponent(Renderer);
        if (!renderer) {
            console.warn("Can not change color: No renderer on " + this.name);
            return;
        }
        for (let i = 0; i < renderer.sharedMaterials.length; i++) {
            const material = renderer.sharedMaterials[i] as MeshBasicMaterial;
            material.color = new Color(Math.random(), Math.random(), Math.random());

            if (this.randomMetallicRoughness && material instanceof MeshStandardMaterial) {
                material.metalness = Math.random();
                material.roughness = Math.random() * Math.random();
            }
            material.needsUpdate = true;
            InstancingUtil.markDirty(this.gameObject);
        }
    }
}
// END MARKER Set Random Color