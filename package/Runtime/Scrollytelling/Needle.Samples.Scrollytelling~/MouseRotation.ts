import { Behaviour } from "@needle-tools/engine";
import { Mathf } from "@needle-tools/engine";



export class MouseRotation extends Behaviour {

    private targetRotation : number = 0;

    maxRotation : number = .1;

    update() {
        const rc = this.context.input.getPointerPositionRC(0);
        if(!rc) return;
        this.targetRotation = rc.x * this.maxRotation;
        this.gameObject.rotation.y = Mathf.lerp(this.gameObject.rotation.y, this.targetRotation, this.context.time.deltaTime);
    }

}
