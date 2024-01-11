import { Behaviour, Renderer, Rigidbody, serializable, showBalloonMessage } from "@needle-tools/engine";

export class ResetPositionOnInterval extends Behaviour {

    @serializable()
    interval : number = 3;

    @serializable()
    resetPosition: boolean = true;

    @serializable()
    resetRotation: boolean = false;

    @serializable()
    resetVelocity: boolean = false;

    start() {
        const pos = this.gameObject.position.clone();
        const rot = this.gameObject.rotation.clone();
        const rb = this.gameObject.getComponent(Rigidbody);
        const startFrame = this.context.time.frame;
        setInterval(() => {
            if(this.resetPosition)
                this.gameObject.position.copy(pos);

            if(this.resetRotation)
                this.gameObject.rotation.copy(rot);

            if(rb && this.resetVelocity && this.context.time.frame !== startFrame)
                rb.resetVelocities();
        }, this.interval * 1000);
    }
}

export class ToggleVisibility extends Behaviour {
    toggleRendererOnly: boolean = false;

    start() {
        setInterval(() => {
            showBalloonMessage("This is a sample for showing how to <a href=\"https://engine.needle.tools/docs/scripting.html#component-architecture\" target=\"_blank\">toggle visibility of a GameObject</a>");
            if (this.toggleRendererOnly) {
                const rend = this.gameObject.getComponent(Renderer);
                if (rend) rend.enabled = !rend.enabled;
            }
            else this.gameObject.visible = !this.gameObject.visible;
        }, 1000)
    }
}
