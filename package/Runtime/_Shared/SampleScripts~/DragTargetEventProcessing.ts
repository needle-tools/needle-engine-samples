import { Behaviour, DragTarget, DragTargetAllowEventArgs, DragTargetEventArgs, GameObject, getWorldPosition, getWorldQuaternion, serializable, setWorldPosition, setWorldQuaternion } from "@needle-tools/engine";
import { Object3D } from "three";

// Documentation → https://docs.needle.tools/scripting

/**
 * Reacts to drops on the {@link DragTarget} on this same object: delete, move, reparent and/or
 * duplicate the dropped object, and optionally restrict what is accepted to a list of tags.
 *
 * Add this next to a DragTarget component - it subscribes to that DragTarget's events itself,
 * no manual event wiring needed. Every action below can be toggled independently; when several
 * are enabled they run in the order they're listed here.
 */
export class DragTargetEventProcessing extends Behaviour {

    /** Duplicate the dropped object and place the copy at {@link duplicateTarget}. */
    @serializable()
    duplicateOnDrop: boolean = false;

    /** Where the duplicate is placed. Only used when {@link duplicateOnDrop} is enabled. */
    @serializable(GameObject)
    duplicateTarget?: Object3D;

    /** Move the dropped object to {@link setPositionTarget}'s position and rotation. */
    @serializable()
    setPositionOnDrop: boolean = false;

    /** Where the dropped object is moved to. Only used when {@link setPositionOnDrop} is enabled. */
    @serializable(GameObject)
    setPositionTarget?: Object3D;

    /** Reparent the dropped object under {@link reparentTarget}, keeping its world position. */
    @serializable()
    reparentOnDrop: boolean = false;

    /** The new parent for the dropped object. Only used when {@link reparentOnDrop} is enabled. */
    @serializable(GameObject)
    reparentTarget?: Object3D;

    /** Destroy the dropped object. Runs last, after any duplicate/move/reparent above. */
    @serializable()
    deleteOnDrop: boolean = false;

    /**
     * Tags a dragged object is allowed to have to be accepted here. Empty means: any tag is fine.
     * The dragged object must carry one of these tags (its `tag`, set via `GameObject.tag`).
     */
    @serializable()
    allowedTags: string[] = [];

    private _dragTarget: DragTarget | null = null;
    private _unsubscribe: Function[] = [];

    onEnable(): void {
        this._dragTarget = GameObject.getComponent(this.gameObject, DragTarget);
        if (!this._dragTarget) {
            console.warn(`${this.name}: DragTargetEventProcessing requires a DragTarget component on the same object`, this.gameObject);
            return;
        }

        this._unsubscribe.push(this._dragTarget.objectDropped.addEventListener(args => this.onObjectDropped(args)));
        this._unsubscribe.push(this._dragTarget.allowTarget.addEventListener(args => this.onAllowTarget(args)));
    }

    onDisable(): void {
        for (const unsub of this._unsubscribe) unsub();
        this._unsubscribe.length = 0;
        this._dragTarget = null;
    }

    private onAllowTarget(args: DragTargetAllowEventArgs) {
        if (this.allowedTags.length === 0) return;
        const tag = args.object.userData?.tag;
        if (!tag || !this.allowedTags.includes(tag)) args.disallow();
    }

    private onObjectDropped(args: DragTargetEventArgs) {
        const object = args.object;

        if (this.duplicateOnDrop && this.duplicateTarget) {
            GameObject.instantiate(object, {
                parent: this.duplicateTarget,
                position: [0, 0, 0],
                rotation: [0, 0, 0],
            });
        }

        if (this.setPositionOnDrop && this.setPositionTarget) {
            setWorldPosition(object, getWorldPosition(this.setPositionTarget));
            setWorldQuaternion(object, getWorldQuaternion(this.setPositionTarget));
        }

        if (this.reparentOnDrop && this.reparentTarget) {
            this.reparentTarget.attach(object);
        }

        // Runs last: deleting the object first would break the actions above.
        if (this.deleteOnDrop) {
            GameObject.destroy(object);
        }
    }
}
