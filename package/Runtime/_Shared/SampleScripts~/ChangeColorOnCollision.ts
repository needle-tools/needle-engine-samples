// START MARKER Change Color On Collision
import { Behaviour, Collision, Renderer } from "@needle-tools/engine";
import{ Color } from "three";

export class ChangeColorOnCollision extends Behaviour {

    private renderer: Renderer | null = null;
    private collisionCount: number = 0;

    private _startColor? : Color[];

    start() {
        this.renderer = this.gameObject.getComponent(Renderer);
        if (!this.renderer) return;
        if(!this._startColor) this._startColor = [];
        for (let i = 0; i < this.renderer.sharedMaterials.length; i++) {
            this.renderer.sharedMaterials[i] = this.renderer.sharedMaterials[i].clone();
            this._startColor[i] = this.renderer.sharedMaterials[i]["color"].clone();
        }
    }

    onCollisionEnter(_col: Collision) {
        if (!this.renderer) return;
        this.collisionCount += 1;
        for (let i = 0; i < this.renderer.sharedMaterials.length; i++) {
            this.renderer.sharedMaterials[i]["color"].setRGB(Math.random(), Math.random(), Math.random());
        }
    }

    onCollisionExit(_col: Collision) {
        if (!this.renderer || !this._startColor) return;
        this.collisionCount -= 1;
        if (this.collisionCount === 0) {
            for (let i = 0; i < this.renderer.sharedMaterials.length; i++) {
                this.renderer.sharedMaterials[i]["color"].copy(this._startColor[i])
                // .setRGB(.1, .1, .1);
            }
        }
    }

    // more events:
    // onCollisionStay(_col: Collision)
    // onCollisionExit(_col: Collision)
}
// END MARKER Change Color On Collision