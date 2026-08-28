import { Behaviour, Collision, DragControls, GameObject, Rigidbody, serializable } from "@needle-tools/engine";
import { Object3D } from "three";

// Documentation → https://docs.needle.tools/scripting

/**
 * Sticks an arrow into this object on impact, and lets it go again the moment it's grabbed with
 * {@link DragControls}.
 *
 * Add this to whatever the arrow should stick into - a target board, a wall, a practice dummy.
 * Needs a {@link Collider} on this object (or a child of it) to receive the hit at all, and the
 * incoming arrow needs both a {@link Rigidbody} (to have hit anything) and a {@link DragControls}
 * (the thing that pulls it back out again - nothing without one is treated as an arrow).
 */
export class ArrowStickTarget extends Behaviour {

    /**
     * Only objects on one of these layers are stuck. `-1` (Everything) accepts anything that hits
     * it with a {@link Rigidbody} and a {@link DragControls} - same convention and default as
     * {@link DragTarget.targetMask}, which is normally the other half of this setup: arrows are
     * commonly put on their own layer so a {@link DragTarget} slot only accepts arrows, and this
     * only sticks arrows - both reading the one layer.
     */
    // @type UnityEngine.LayerMask
    @serializable()
    layerMask : number = -1;

    /** Minimum impact speed, in m/s, required to stick. A gentle touch just bounces off instead. */
    @serializable()
    minImpactSpeed: number = 0.5;

    @serializable()
    setKinematicOnStick: boolean = true;

    /** Arrows currently stuck in this target, and the cleanup for each one's `dragStarted`
     *  subscription - run once, whichever comes first: the arrow is grabbed, or this component is
     *  disabled while it's still waiting. */
    private readonly _stuck = new Map<Object3D, Function>();

    onDisable(): void {
        for (const unsubscribe of this._stuck.values()) unsubscribe();
        this._stuck.clear();
    }

    onCollisionEnter(col: Collision): void {
        const rigidbody = col.rigidBody;
        if (!(rigidbody instanceof Rigidbody)) return;

        const arrow = rigidbody.gameObject;
        if (this._stuck.has(arrow)) return;
        // -1 is Unity's "Everything"; the mask only filters when it says something narrower.
        if (this.layerMask !== -1 && (arrow.layers.mask & this.layerMask) === 0) return;

        // The thing that will pull it back out again later - no drag controls, nothing to grab.
        const dragControls = GameObject.getComponentInChildren(arrow, DragControls);
        if (!dragControls) return;

        if (rigidbody.getVelocity().length() < this.minImpactSpeed) return;

        this.stick(arrow, rigidbody, dragControls);
    }

    private stick(arrow: Object3D, rigidbody: Rigidbody, dragControls: DragControls): void {
        rigidbody.resetVelocities();
        rigidbody.isKinematic = true;

        // Keeps the exact pose it hit at - that pose *is* "stuck", nothing to reposition.
        this.gameObject.attach(arrow);

        const unsubscribe = dragControls.dragStarted.addEventListener(() => {
            this._stuck.delete(arrow);
            unsubscribe();

            rigidbody.isKinematic = this.setKinematicOnStick;
            this.context.scene.attach(arrow);
        });
        this._stuck.set(arrow, unsubscribe);
    }
}
