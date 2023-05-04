import { Behaviour, Renderer, serializeable } from "@needle-tools/engine";
import { CanvasTexture } from "three";

export class CanvasToObject extends Behaviour {

    private _canvasTexture?: CanvasTexture;

    @serializeable(Renderer)
    renderers: Renderer[] = [];

    start() {
        const canvas = document.querySelector("canvas.p5Canvas");
        const tex = new CanvasTexture(canvas);
        this._canvasTexture = tex;

        for (const rend of this.renderers) {
            if (rend?.sharedMaterial) {
                rend.sharedMaterial["map"] = tex;
                rend.sharedMaterial.transparent = true;
            }
        }
    }

    update() {
        if (this._canvasTexture) this._canvasTexture.needsUpdate = true;

    }
}  