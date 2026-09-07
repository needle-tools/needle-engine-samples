import { Behaviour, serializable } from "@needle-tools/engine";
import { Matrix4, Quaternion, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

/**
 * Keeps this object at a constant world-space scale, no matter how its parents are scaled -
 * including a rotated parent with non-uniform scale.
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

    private readonly _worldPos = new Vector3();
    private readonly _worldQuat = new Quaternion();
    private readonly _worldScale = new Vector3();
    private readonly _targetWorldMatrix = new Matrix4();
    private readonly _parentInverse = new Matrix4();
    private readonly _localMatrix = new Matrix4();
    private readonly _localPos = new Vector3();
    private readonly _localQuat = new Quaternion();
    private readonly _localScale = new Vector3();

    start() {
        if (this.useStartScale) {
            this.gameObject.matrixWorld.decompose(this._worldPos, this._worldQuat, this.targetScale);
        }
    }

    onBeforeRender() {
        const parent = this.gameObject.parent;
        if (!parent) return;

        // Keep this object's own world position and rotation, only replace its world scale -
        // then re-derive the local scale needed to produce that, given the parent's *actual*
        // world matrix (rotation + non-uniform scale and all, no shear-blind shortcuts).
        this.gameObject.matrixWorld.decompose(this._worldPos, this._worldQuat, this._worldScale);
        this._targetWorldMatrix.compose(this._worldPos, this._worldQuat, this.targetScale);

        this._parentInverse.copy(parent.matrixWorld).invert();
        this._localMatrix.multiplyMatrices(this._parentInverse, this._targetWorldMatrix);
        this._localMatrix.decompose(this._localPos, this._localQuat, this._localScale);

        this.gameObject.scale.copy(this._localScale);
    }
}
