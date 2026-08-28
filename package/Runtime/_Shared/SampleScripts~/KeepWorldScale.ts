import { Behaviour, serializable } from "@needle-tools/engine";
import { Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

/**
 * Keeps this object at a constant world-space scale, no matter how its parents are scaled.
 *
 * Useful for UI elements, gizmos, or icons attached to objects that get scaled dynamically
 * (e.g. a label on a resizable object) where the child should stay visually the same size.
 */
export class KeepWorldScale extends Behaviour {

    /** The world-space scale this object should always have. */
    @serializable(Vector3)
    targetScale: Vector3 = new Vector3(1, 1, 1);

    /** If enabled, `targetScale` is captured from the object's current world scale on start,
     *  instead of using the value above. */
    @serializable()
    useStartScale: boolean = true;

    private readonly _parentWorldScale = new Vector3();

    start() {
        if (this.useStartScale) {
            this.gameObject.getWorldScale(this.targetScale);
        }
    }

    onBeforeRender() {
        const parent = this.gameObject.parent;
        if (!parent) return;

        parent.getWorldScale(this._parentWorldScale);
        this.gameObject.scale.set(
            this._parentWorldScale.x !== 0 ? this.targetScale.x / this._parentWorldScale.x : this.targetScale.x,
            this._parentWorldScale.y !== 0 ? this.targetScale.y / this._parentWorldScale.y : this.targetScale.y,
            this._parentWorldScale.z !== 0 ? this.targetScale.z / this._parentWorldScale.z : this.targetScale.z,
        );
    }
}
