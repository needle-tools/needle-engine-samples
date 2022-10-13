import { Behaviour, Collision, Renderer } from "@needle-tools/engine";

export class ChangeColorOnCollision extends Behaviour {

    private renderer: Renderer | null = null;

    start() {
        this.renderer = this.gameObject.getComponent(Renderer);
        if (!this.renderer) return;
        for (let i = 0; i < this.renderer.sharedMaterials.length; i++) {
            this.renderer.sharedMaterials[i] = this.renderer.sharedMaterials[i].clone();
        }
    }

    onCollisionEnter(_col: Collision) {
        if (!this.renderer) return;
        for (let i = 0; i < this.renderer.sharedMaterials.length; i++) {
            this.renderer.sharedMaterials[i].color.setRGB(Math.random(), Math.random(), Math.random());
        }
    }

    // more events:
    // onCollisionStay(_col: Collision)
    // onCollisionExit(_col: Collision)
}

