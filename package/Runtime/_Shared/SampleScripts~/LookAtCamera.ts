import { Behaviour, serializeable } from "@needle-tools/engine";
import { getWorldPosition, lookAtInverse } from "@needle-tools/engine/src/engine/engine_three_utils";

export class LookAtCamera extends Behaviour {
    @serializeable()
    inverse: boolean = false;

    update() {
        const cam = this.context.mainCameraComponent?.gameObject;
        if (!cam || cam === this.gameObject) return;
        const point = getWorldPosition(cam);
        
        if (this.inverse)
            lookAtInverse(this.gameObject, point);
        else
            this.gameObject.lookAt(point);
    }
}
