import { Behaviour, GameObject, serializable } from "@needle-tools/engine";
import { Vector3 } from "three";

export class AlignCamera extends Behaviour {
    @serializable()
    target?: GameObject;

    @serializable(Vector3)
    offset: Vector3 = new Vector3();

    onBeforeRender(_frame: XRFrame | null): void {
        if (!this.target) return;

        this.gameObject.worldPosition = this.target.worldPosition;
        this.gameObject.position.add(this.offset);
    }
}