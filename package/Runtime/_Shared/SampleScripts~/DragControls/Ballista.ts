import { Behaviour, DragControls, DragTarget, GameObject, Gizmos, Rigidbody, delayForFrames, getParam, serializable, setWorldQuaternion } from "@needle-tools/engine";
import { Object3D, Quaternion, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

/** Add `?debugballista` to the URL to draw the aiming gizmos and log every shot. */
const debug = getParam("debugballista");

/**
 * A ballista: load an arrow into {@link loadTarget} (a {@link DragTarget}), pull back
 * {@link drawControls} (a {@link DragControls} in Slide mode) to draw the mechanism, and let go
 * to fire.
 *
 * On release the loaded arrow is detached from {@link loadTarget} and shot along
 * {@link shootDirection} by applying an impulse to its {@link Rigidbody}, scaled by how far the
 * mechanism was drawn.
 *
 * Add this next to the {@link DragControls} that does the drawing - it subscribes to that
 * component's `dragEnded` event itself, no manual event wiring needed.
 */
export class Ballista extends Behaviour {

    /** Where arrows are loaded. Slot 0 (or, in {@link DragTarget.mode} Single, the target itself)
     *  is read as the loaded arrow when the mechanism is released. */
    @serializable(DragTarget)
    loadTarget!: DragTarget;

    /**
     * The {@link loadTarget} slot transform the arrow is loaded into - normally the same object as
     * `loadTarget.slots[0]`. Optional; without it the arrow's own transform is used instead.
     *
     * This is the reference for **how the arrow is oriented**, which is what the slot decides: a
     * snapped arrow takes the slot's rotation, so the slot says where the nose points before the
     * shot is worked out. Reading it off the slot rather than the arrow is the more reliable of
     * the two - the arrow may have been nudged, may not have snapped rotation at all, or may be
     * mid-settle when the string is released, while the slot is always exactly where it was
     * authored.
     */
    @serializable(Object3D)
    slotTransform?: Object3D;

    /** The Slide-mode {@link DragControls} that draws the shooting mechanism back. */
    @serializable(DragControls)
    drawControls!: DragControls;

    /** The transform that aims the shot. Which of its local axes is used is {@link shootAxis}. */
    @serializable(Object3D)
    shootDirection!: Object3D;

    /**
     * Local axis of {@link shootDirection} that runs **down the barrel**. Defaults to +Z, which is
     * Unity's forward and also what three.js `Object3D.getWorldDirection()` returns.
     *
     * Worth setting explicitly rather than trusting forward: an object's axes do not necessarily
     * survive the trip from Unity looking the way they did in the editor - the exporter changes
     * handedness, and a model or prefab authored Z-up arrives rotated a quarter turn on top of
     * that. So the axis that pointed down the barrel in the scene view may not be the one that
     * does at runtime.
     *
     * With `?debugballista` the three dim red/green/blue arrows on {@link shootDirection} are its
     * local +X / +Y / +Z **as they actually are in the browser**. Read off the one running down the
     * barrel and put it here; the bright cyan arrow is what this currently resolves to.
     */
    @serializable(Vector3)
    shootAxis: Vector3 = new Vector3(0, 0, 1);

    /**
     * The arrow model's own **nose axis**, in its local space: the direction the mesh points.
     * Defaults to +Z, matching the `Bow & Arrow` sample's arrows.
     *
     * This is the compensation for a model that isn't built facing -Z. It turns the arrow on
     * release so its nose lands on the flight direction, rather than bending the flight direction
     * to match the model - the impulse always follows {@link shootDirection}. Set it to `(0, 1, 0)`
     * for an arrow whose nose points along its own +Y, and so on.
     */
    @serializable(Vector3)
    arrowForward: Vector3 = new Vector3(0, 0, 1);

    /** Impulse applied to the arrow's rigidbody at maximum draw. */
    @serializable()
    force: number = 10;

    /** Impulse applied at zero draw. A fully-loaded shot never falls below this. */
    @serializable()
    minForce: number = 1;

    /**
     * Minimum {@link DragControls.normalizedValue} the mechanism must be drawn past to fire.
     * Released short of this, the mechanism still snaps back to rest but no arrow is shot - a
     * light tug shouldn't loose the arrow the way a full draw does.
     */
    @serializable()
    minDrawThreshold: number = 0.5;

    /** Length of the debug gizmos in world units. Only used with `?debugballista`. */
    @serializable()
    debugGizmoScale: number = 0.5;

    private _unsubscribe?: Function;

    onEnable(): void {
        if (!this.loadTarget || !this.drawControls || !this.shootDirection) {
            console.warn(`${this.name}: Ballista requires loadTarget, drawControls and shootDirection to be assigned`, this.gameObject);
            return;
        }
        this._unsubscribe = this.drawControls.dragEnded.addEventListener(() => this.onDrawReleased());
    }

    onDisable(): void {
        this._unsubscribe?.();
        this._unsubscribe = undefined;
    }

    /**
     * Live aiming gizmos, drawn only with `?debugballista`.
     *
     * Two triads, and the two fields they exist to let you fill in:
     * - **Dim red/green/blue on {@link shootDirection}** — its local +X / +Y / +Z as they really
     *   are in the browser, which is not necessarily how Unity drew them. Read off the one running
     *   down the barrel and put it in {@link shootAxis}. **Bright cyan** is what {@link shootAxis}
     *   currently resolves to; when it's right, cyan runs down the barrel.
     * - **Bright red/green/blue on the loaded arrow** — its local +X / +Y / +Z. Read off which one
     *   points out of the nose and put that in {@link arrowForward}. **Yellow** is the axis
     *   {@link arrowForward} currently names; when it's set right, yellow points out of the nose.
     */
    onBeforeRender(): void {
        if (!debug || !this.shootDirection) return;
        const s = this.debugGizmoScale;

        // shootDirection's own local axes, as they really are at runtime rather than as Unity drew
        // them. Dimmed, so they read as reference rather than as the answer.
        const origin = this.shootDirection.getWorldPosition(new Vector3());
        const aim = this.shootDirection.getWorldQuaternion(new Quaternion());
        this.drawAxis(origin, new Vector3(1, 0, 0).applyQuaternion(aim), s, 0x884444, "aim +X");
        this.drawAxis(origin, new Vector3(0, 1, 0).applyQuaternion(aim), s, 0x448844, "aim +Y");
        this.drawAxis(origin, new Vector3(0, 0, 1).applyQuaternion(aim), s, 0x444488, "aim +Z");

        // What shootAxis currently resolves to - this is where the arrow will actually go.
        const flight = this.getFlightDirection();
        Gizmos.DrawArrow(origin, origin.clone().addScaledVector(flight, s * 1.5), 0x00ffff, 0, false);
        this.drawLabel(origin.clone().addScaledVector(flight, s * 1.5), "flight", s, 0x00ffff);

        // How the loaded arrow is built.
        const arrow = this.loadTarget?.getOccupant(0);
        if (!arrow) return;
        const p = arrow.getWorldPosition(new Vector3());
        const q = arrow.getWorldQuaternion(new Quaternion());
        this.drawAxis(p, new Vector3(1, 0, 0).applyQuaternion(q), s, 0xff0000, "+X");
        this.drawAxis(p, new Vector3(0, 1, 0).applyQuaternion(q), s, 0x00ff00, "+Y");
        this.drawAxis(p, new Vector3(0, 0, 1).applyQuaternion(q), s, 0x0000ff, "+Z");

        // The resolved nose direction - off the slot when there is one, so this is the vector the
        // shot will actually be corrected from. It should come out of the arrow's tip.
        const nose = this.getNoseDirection(arrow);
        if (nose) this.drawAxis(p, nose, s * 1.35, 0xffff00, this.slotTransform ? "nose (slot)" : "nose (arrow)");

        // The slot's own orientation, drawn at the slot rather than at the arrow so the two can be
        // told apart when they disagree - which is exactly the case slotTransform exists for.
        if (this.slotTransform) {
            const sp = this.slotTransform.getWorldPosition(new Vector3());
            const sqt = this.slotTransform.getWorldQuaternion(new Quaternion());
            this.drawAxis(sp, new Vector3(0, 0, 1).applyQuaternion(sqt), s * 0.8, 0xff8800, "slot +Z");
        }
    }

    /**
     * World-space direction the arrow flies: {@link shootAxis} taken out of
     * {@link shootDirection}'s local space.
     *
     * Deliberately not `getWorldDirection()`. That returns the object's **+Z** (only `Camera`
     * overrides it to -Z), which is one fixed axis with no say in the matter - and the whole
     * problem here is that the axis pointing down the barrel at runtime isn't always the one that
     * did in the editor.
     */
    private getFlightDirection(out: Vector3 = new Vector3()): Vector3 {
        out.copy(this.shootAxis);
        if (out.lengthSq() < 1e-8) out.set(0, 0, 1);
        return out.applyQuaternion(this.shootDirection.getWorldQuaternion(new Quaternion())).normalize();
    }

    /**
     * World direction the loaded arrow's nose points: {@link arrowForward} taken out of the
     * orientation that decides it - {@link slotTransform} when assigned, the arrow itself when not.
     * `null` when {@link arrowForward} is degenerate.
     */
    private getNoseDirection(arrow: Object3D, out: Vector3 = new Vector3()): Vector3 | null {
        out.copy(this.arrowForward);
        if (out.lengthSq() < 1e-8) return null;
        const reference = this.slotTransform ?? arrow;
        return out.applyQuaternion(reference.getWorldQuaternion(new Quaternion())).normalize();
    }

    /** The rotation that takes the arrow's nose onto `flight`. `null` if the nose is unknown. */
    private getNoseCorrection(arrow: Object3D, flight: Vector3): Quaternion | null {
        const nose = this.getNoseDirection(arrow);
        return nose ? new Quaternion().setFromUnitVectors(nose, flight) : null;
    }

    private drawAxis(origin: Vector3, dir: Vector3, length: number, color: number, label: string) {
        const tip = origin.clone().addScaledVector(dir, length);
        Gizmos.DrawArrow(origin, tip, color, 0, false);
        this.drawLabel(tip, label, length, color);
    }

    /** A gizmo label that stays readable through the ballista's own geometry. */
    private drawLabel(position: Vector3, text: string, scale: number, color: number, duration: number = 0) {
        // The trailing `false` is depthTest - the last parameter, after `parent`.
        Gizmos.DrawLabel(position, text, scale * 0.06, duration, color, undefined, undefined, false);
    }

    private async onDrawReleased(): Promise<void> {
        // Read the draw amount before resetting it below - resetToRest sets it back to 0.
        const drawAmount = this.drawControls.normalizedValue;


        if (drawAmount < this.minDrawThreshold) {
            if (debug) console.log(`[Ballista] not fired - drawn ${drawAmount.toFixed(3)}, needs ${this.minDrawThreshold}`);
            return;
        }

        const arrow = this.loadTarget.getOccupant(0);
        if (!arrow) {
            if (debug) console.warn(`[Ballista] nothing loaded - ${this.loadTarget.name} slot 0 is empty. Occupants:`, [...this.loadTarget.occupants]);
            return;
        }

        // Detach it from the loading socket before it starts flying - otherwise it would keep
        // being tracked (and possibly snapped back) as the target's occupant.
        this.loadTarget.releaseObject(arrow);

        const rigidbody = GameObject.getComponentInChildren(arrow, Rigidbody);
        if (!rigidbody) {
            console.warn(`${this.name}: loaded arrow has no Rigidbody, cannot shoot it`, arrow);
            return;
        }

        // Where it flies - straight off the barrel, independent of how the model is built.
        const direction = this.getFlightDirection();

        // Where it points. The slot decides the arrow's orientation, so the nose direction is read
        // from there - see slotTransform - and the correction is the rotation that takes that nose
        // onto the flight direction. Resolved to a final world rotation now, while the arrow is
        // still seated, so the wait below cannot make it stale.
        const correction = this.getNoseCorrection(arrow, direction);
        // Applied on top of the arrow's current rotation rather than replacing it, so whatever roll
        // the arrow was sitting at in the slot survives the shot. Replacing it would flatten a
        // fletching that was deliberately turned.
        const aimed = correction?.clone().multiply(arrow.getWorldQuaternion(new Quaternion())) ?? null;

        const impulse = this.minForce + drawAmount * (this.force - this.minForce);

        // Wait a frame before touching the body at all. DragControls finishes its drag *after*
        // firing dragEnded: it resumes the physics it suspended - restoring the kinematic flag -
        // and then writes its own release velocity onto every rigidbody it was dragging. That list
        // is `getComponentsInChildren(draggedObject)` captured at drag start, so an arrow parented
        // under the mechanism is in it, and an impulse applied here is wiped a moment later. The
        // arrow then simply drops, which looks exactly like a wrong direction.
        await delayForFrames(1);
        if (!this.activeAndEnabled || !arrow.parent) return;

        if (aimed) setWorldQuaternion(arrow, aimed);
        rigidbody.isKinematic = false;

        // A second, separate wait - not a bigger first one. The kinematic-to-dynamic switch just
        // above and applyImpulse below cannot share a tick: Rapier only fully commits a body-type
        // change when it next steps the world, so an impulse fired in the same tick as the switch
        // lands on a body still internally treated as kinematic and is silently dropped - kinematic
        // bodies ignore impulses by design. `ArrowShooting.ts` hits this same requirement and waits
        // a frame between the two for exactly this reason.
        await delayForFrames(1);
        if (!this.activeAndEnabled || !arrow.parent) return;

        rigidbody.applyImpulse(direction.clone().multiplyScalar(impulse), true);

        if (debug) {
            // Read back in the same tick as the impulse, before anything else this frame - Rigidbody,
            // LateUpdate, physics.step - gets a chance to touch the body. If this already reads ~0,
            // the impulse itself never reached the simulated body; if it reads correctly here but not
            // a couple of frames later, something *after* this line is the one undoing it.
            console.log(`[Ballista] velocity immediately after applyImpulse:`, rigidbody.getVelocity().clone());
            this.debugShot(arrow, rigidbody, direction, drawAmount, impulse);
        }
    }

    /** Draws the shot that was just taken and reports what the physics engine did with it. */
    private debugShot(arrow: Object3D, rigidbody: Rigidbody, direction: Vector3, drawAmount: number, impulse: number) {
        const s = this.debugGizmoScale;
        const from = arrow.getWorldPosition(new Vector3());
        const tip = from.clone().addScaledVector(direction, s * 2);
        // Magenta, and it lingers - this is the shot itself, worth still seeing after the arrow
        // has left. Everything drawn from onBeforeRender is momentary by comparison.
        Gizmos.DrawArrow(from, tip, 0xff00ff, 3, false);
        this.drawLabel(tip, `impulse ${impulse.toFixed(2)}`, s, 0xff00ff, 3);

        // Measured off the arrow itself, after the correction has been applied - so this reports
        // where the nose actually ended up, not where the slot said it would be. Anything but ~0°
        // means arrowForward names the wrong axis of the reference it was read from.
        const nose = this.arrowForward.clone();
        const noseWorld = nose.lengthSq() > 1e-8
            ? nose.normalize().applyQuaternion(arrow.getWorldQuaternion(new Quaternion()))
            : null;
        const offBy = noseWorld ? Math.acos(Math.min(1, Math.max(-1, noseWorld.dot(direction)))) * 180 / Math.PI : NaN;

        console.log(`[Ballista] fired "${arrow.name}" - draw ${drawAmount.toFixed(3)}, impulse ${impulse.toFixed(2)}`
            + `, nose off flight direction by ${offBy.toFixed(1)}°`,
            { direction: direction.clone(), mass: rigidbody.mass, isKinematic: rigidbody.isKinematic });

        // The impulse silently does nothing if the body isn't in the simulation yet, which looks
        // exactly like a wrong direction. Read the velocity back once physics has had a turn.
        delayForFrames(2).then(() => {
            const v = rigidbody.getVelocity().clone();
            if (v.lengthSq() < 1e-6)
                console.warn(`[Ballista] arrow did not move - impulse was applied but velocity is ~0.`
                    + ` The Rigidbody may not have been in the simulation yet, or is still kinematic.`, rigidbody);
            else console.log(`[Ballista] velocity after 2 frames:`, v, `speed ${v.length().toFixed(2)}`);
        });
    }
}
