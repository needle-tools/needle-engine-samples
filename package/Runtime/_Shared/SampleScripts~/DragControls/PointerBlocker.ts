import {
    Behaviour, DragControls, EventSystem, IPointerEventHandler, ObjectRaycaster, PointerEventData,
    Renderer, serializable,
} from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

/**
 * Makes a mesh shield whatever is behind it from the pointer: a lid over a draggable object, a
 * pane in front of a button, an invisible blocker across a doorway. Put it on the mesh that should
 * do the shielding - not on the object being shielded.
 *
 * The {@link EventSystem} already stops at the nearest hit and gives the event to that object
 * alone, so a mesh standing in front of a {@link DragControls} object would seem to be enough on
 * its own. It is not, and the reason is easy to lose an afternoon to: before the raycast runs, the
 * EventSystem filters out every object that has no enabled component implementing a pointer
 * handler for the event being dispatched. A mesh with nothing on it is never tested, so it never
 * enters the hit list, so it cannot be the nearest hit - the ray simply passes through it and the
 * draggable object behind picks the event up. The filter exists to keep hover-time raycasts off
 * meshes that could never do anything with them, which is most of a scene.
 *
 * That is what this component supplies. Its handlers are deliberately empty: they do nothing with
 * the event, they exist so the mesh is admitted to the raycast, and the nearest-hit rule in the
 * EventSystem does the actual blocking. An object with a Button on it shields what is
 * behind it for the same reason, which is why a Button works as a makeshift blocker - the shielding
 * is not the button's doing.
 *
 * **What it needs to work**
 * - A {@link Renderer} with real geometry. Pointer events are raycast against visible mesh
 *   geometry, not against colliders, so an empty object or a collider-only object blocks nothing.
 * - The object must be active: the EventSystem ignores a hit on an object that is switched off,
 *   and so does the renderer. To block *without* being seen, use {@link hideMesh} rather than
 *   deactivating the object.
 * - Somewhere at or above it, a raycaster that covers it. This component adds an
 *   {@link ObjectRaycaster} to its own object if it finds none in its parents, the same way
 *   {@link DragControls} does, so usually there is nothing to set up.
 *
 * **What it does not do.** It decides who receives a *new* pointer event. A drag that is already
 * running follows the pointer wherever it goes, across this mesh included - to stop a drag part way
 * through, constrain the drag itself. It also has no effect on physics raycasts, which are a
 * separate system that reads colliders.
 *
 * One material setting defeats it: a material with depthTest switched off is moved to the front of
 * the candidate list whatever its distance, so such an object is picked ahead of this blocker even
 * when it sits well behind it.
 *
 * @category Interactivity
 * @group Components
 */
export class PointerBlocker extends Behaviour implements IPointerEventHandler {

    /** Also shield the object behind from hover, not only from presses and clicks.
     *
     *  Worth its own switch because the EventSystem filters per event type: a blocker that only
     *  answered to presses would let pointermove through, and the object behind would go on
     *  highlighting itself and changing the cursor for a spot that cannot be pressed. Turn this off
     *  to keep that hover feedback alive while still swallowing the press. */
    @serializable()
    get blockHover(): boolean { return this._blockHover; }
    set blockHover(value: boolean) {
        this._blockHover = value;
        this.applyHoverHandlers();
    }
    private _blockHover: boolean = true;

    /** Keep blocking, but stop drawing the mesh - for a pane whose job is only to be in the way.
     *
     *  The mesh stays active, because an inactive one is skipped by the raycast as well as by the
     *  renderer. Instead its materials are cloned and told to write neither colour nor depth, which
     *  leaves the geometry there for the raycast and invisible to the camera. The clone is so that
     *  a material shared with other objects in the scene does not vanish along with this one. */
    @serializable()
    public hideMesh: boolean = false;

    awake(): void {
        this.applyHoverHandlers();
    }

    start(): void {
        // Same guard DragControls uses: an ObjectRaycaster only casts against its own subtree, so
        // without one covering this object the EventSystem never sees this mesh at all.
        if (!this.gameObject.getComponentInParent(ObjectRaycaster))
            this.gameObject.addComponent(ObjectRaycaster);

        if (this.hideMesh) this.applyHideMesh();
    }

    // The handlers below are the whole point of the component - they are what makes the EventSystem
    // admit this mesh to the raycast. Each event type is asked for separately, so a blocker that is
    // meant to swallow everything has to answer to all of them.

    onPointerDown(_args: PointerEventData) { }
    onPointerUp(_args: PointerEventData) { }
    onPointerClick(_args: PointerEventData) { }
    onPointerEnter(_args: PointerEventData) { }
    onPointerExit(_args: PointerEventData) { }
    onPointerMove(_args: PointerEventData) { }

    /**
     * The EventSystem tests for the hover handlers by asking whether this instance *has* them, so
     * switching hover blocking off means taking them off this instance: an own property set to
     * undefined hides the one on the prototype, and deleting it lets the prototype show through
     * again. Doing it this way keeps {@link blockHover} live - the next pointer event picks up the
     * change, because the EventSystem clears its per-object cache before every raycast.
     */
    private applyHoverHandlers() {
        const self = this as Partial<IPointerEventHandler>;
        if (this._blockHover) {
            delete self.onPointerEnter;
            delete self.onPointerExit;
            delete self.onPointerMove;
        }
        else {
            self.onPointerEnter = undefined;
            self.onPointerExit = undefined;
            self.onPointerMove = undefined;
        }
    }

    private applyHideMesh() {
        const renderers = this.gameObject.getComponentsInChildren(Renderer);
        for (const renderer of renderers) {
            const materials = renderer.sharedMaterials;
            if (!materials) continue;
            for (let i = 0; i < materials.length; i++) {
                const material = materials[i]?.clone();
                if (!material) continue;
                material.colorWrite = false;
                material.depthWrite = false;
                // depthTest is deliberately left alone: turning it off would move this object to the
                // front of the candidate list regardless of distance and it would start blocking
                // things that are actually in front of it.
                materials[i] = material;
            }
        }
    }
}
