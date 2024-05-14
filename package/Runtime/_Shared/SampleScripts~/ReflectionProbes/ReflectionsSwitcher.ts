import { Behaviour, Renderer, serializable } from "@needle-tools/engine";
import { Object3D } from "three";

export class ReflectionsSwitcher extends Behaviour {
    @serializable(Renderer)
    renderers: Renderer[] = [];

    select(anchor: Object3D) {
        this.renderers.forEach(renderer => {
            renderer.probeAnchor = anchor;
        });
    }
}