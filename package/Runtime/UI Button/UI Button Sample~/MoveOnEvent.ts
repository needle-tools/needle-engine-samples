import { Behaviour, serializeable } from "@needle-tools/engine";
import { setWorldPosition } from "@needle-tools/engine/src/engine/engine_three_utils";
import { getWorldPosition } from "@needle-tools/engine/src/engine/engine_three_utils";
import { Object3D, Vector3 } from "three";

export class MoveOnEvent extends Behaviour {

    @serializeable(Object3D)
    target?: Object3D;

    private targetPoint?: Vector3;

    moveNow() {

        console.log("Moving now", this);


        if (!this.targetPoint) this.targetPoint = new Vector3();

        if (this.target) {
            this.targetPoint.copy(getWorldPosition(this.target));
        }
        else {
            // choose random point if no target is assigned
            const areaSize = 2;
            this.targetPoint.add(
                new Vector3(
                    (Math.random() - .5) * areaSize,
                    (Math.random() - .5) * areaSize,
                    (Math.random() - .5) * areaSize
                ));
        }
    }

    update() {
        if (!this.targetPoint) return;
        const wp = this.worldPosition;
        wp.lerp(this.targetPoint, this.context.time.deltaTime / .3);
        this.worldPosition = wp;
    }

}  
