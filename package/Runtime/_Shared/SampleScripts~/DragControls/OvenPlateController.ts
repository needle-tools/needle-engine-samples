import { Behaviour, DragControls, DragTarget, GameObject, getParam, Mathf, Renderer, serializable } from "@needle-tools/engine";
import { Color, MeshStandardMaterial, Object3D } from "three";
import { CookingPot } from "./CookingPot";

// Documentation → https://docs.needle.tools/scripting

/** Add `?debugcooking` to the URL to log what each plate is doing and which pot it is heating. */
const debug = getParam("debugcooking");

/**
 * Drives a 4-plate electric oven: {@link plates} (a {@link DragTarget} in `Slots` mode) is where
 * pots land, {@link handles} are the `Hinge Rotation` {@link DragControls} that turn each plate on,
 * and {@link plateRenderers} are what glows to show it.
 *
 * All three lists are index-matched - `handles[i]` and `plateRenderers[i]` both belong to
 * `plates.slots[i]`. Each plate's {@link DragControls.normalizedValue} is its target strength, but
 * the plate itself only gets there over {@link glowRampSeconds} once turned up, and fades back over
 * {@link glowCooldownSeconds} once turned down - an element has thermal mass, it does not snap to
 * temperature. A plate above {@link activeThreshold} glows proportionally to its actual heat and,
 * if a {@link CookingPot} is sitting in that slot, cooks it at that same heat - including the
 * residual heat while it is still cooling down.
 */
export class OvenPlateController extends Behaviour {

    /** The oven's drop target, in `Slots` mode with one slot per plate. */
    @serializable(DragTarget)
    plates!: DragTarget;

    /** One `Hinge Rotation` handle per plate, same order as `plates.slots`. */
    @serializable(DragControls)
    handles: DragControls[] = [];

    /** One renderer per plate, same order as `plates.slots`, whose material is made to glow. */
    @serializable(Renderer)
    plateRenderers: Renderer[] = [];

    /** Handle position below this (0-1) counts as off: no glow, no cooking. Keeps a barely-nudged
     *  handle from lighting the plate up. */
    @serializable()
    activeThreshold: number = 0.05;

    /** Emissive tint at full strength. Faded towards black below that as the handle turns down. */
    @serializable(Color)
    glowColor: Color = new Color(1, 0.35, 0.05);

    /** Emissive intensity at strength 1. */
    @serializable()
    maxGlowIntensity: number = 4;

    /** Seconds for a plate to go from cold to a handle's full strength once turned up. */
    @serializable()
    glowRampSeconds: number = 1.5;

    /** Seconds for a plate to fade back to cold once turned down again. Also how long it keeps
     *  cooking afterwards, at fading strength - residual heat, the way a real element behaves. */
    @serializable()
    glowCooldownSeconds: number = 3;

    private readonly _plateMaterials: (MeshStandardMaterial | undefined)[] = [];
    private readonly _plateHeat: number[] = [];
    private readonly _wasActive: boolean[] = [];
    private readonly _lastOccupant: (Object3D | null)[] = [];
    private _unsubscribe?: Function;

    onEnable(): void {
        // A pot taken off a plate is done with whatever that plate cooked: the finished state it is
        // still showing gets cleared here rather than lingering until the pot is next used.
        this._unsubscribe = this.plates?.objectRemoved.addEventListener(args => {
            const pot = this.findPot(args.object);
            if (debug) console.log(`[Oven] "${args.object?.name}" removed from plate ${args.slot}`
                + `${pot ? "" : " (no CookingPot)"}`, args.object);
            pot?.clearFinishedCook();
        });

        this._plateMaterials.length = 0;
        this._plateHeat.length = 0;
        for (const renderer of this.plateRenderers) {
            this._plateHeat.push(0);
            // Clone before writing to it - `sharedMaterials` is shared by every renderer that
            // references the same source material, so mutating it in place would make every plate
            // (or anything else using that material) glow together.
            const source = renderer?.sharedMaterials[0] as MeshStandardMaterial | undefined;
            if (!source) {
                this._plateMaterials.push(undefined);
                continue;
            }
            const clone = source.clone();
            renderer.sharedMaterials[0] = clone;
            this._plateMaterials.push(clone);
        }
    }

    update(): void {
        if (!this.plates) {
            if (debug) console.warn("[Oven] no plates DragTarget assigned", this);
            return;
        }
        const deltaTime = this.context.time.deltaTime;
        const count = Math.min(this.handles.length, this.plateRenderers.length, this.plates.slotCount);
        if (debug && count <= 0) {
            console.warn(`[Oven] nothing to drive - handles: ${this.handles.length}, renderers: `
                + `${this.plateRenderers.length}, slots: ${this.plates.slotCount}`, this);
        }

        for (let slot = 0; slot < count; slot++) {
            const heat = this.advanceHeat(slot, this.strengthAt(slot), deltaTime);
            this.updateGlow(slot, heat);

            const active = heat > this.activeThreshold;
            if (debug && active !== (this._wasActive[slot] ?? false)) {
                this._wasActive[slot] = active;
                console.log(`[Oven] plate ${slot} ${active ? "ON" : "off"} - handle `
                    + `${this.strengthAt(slot).toFixed(2)}, heat ${heat.toFixed(2)}`);
            }
            if (!active) continue;

            const occupant = this.plates.getOccupant(slot);
            if (debug && occupant !== (this._lastOccupant[slot] ?? null)) {
                this._lastOccupant[slot] = occupant;
                console.log(`[Oven] plate ${slot} occupant: ${occupant?.name ?? "(empty)"}`, occupant);
            }
            if (!occupant) continue;

            const pot = this.findPot(occupant);
            if (!pot) {
                if (debug) console.warn(`[Oven] plate ${slot}: "${occupant.name}" has no CookingPot`, occupant);
                continue;
            }
            pot.addHeat(heat, deltaTime);
        }
    }

    onDisable(): void {
        this._unsubscribe?.();
        this._unsubscribe = undefined;
    }

    /** The CookingPot belonging to an object sitting on a plate. Looked up rather than added: a pot
     *  carries its own, with its events wired in the editor, and adding one here would silently give
     *  anything that lands on a plate a blank component whose events go nowhere. */
    private findPot(object: Object3D | null | undefined): CookingPot | null {
        if (!object) return null;
        return GameObject.getComponentInChildren(object, CookingPot)
            ?? GameObject.getComponentInParent(object, CookingPot);
    }

    /** The plate's target strength: its handle's `normalizedValue`, or 0 below `activeThreshold`.
     *  This is where the handle is *now* - {@link advanceHeat} is what the plate itself is at, a
     *  step behind while it ramps up or cools down. */
    strengthAt(slot: number): number {
        const value = this.handles[slot]?.normalizedValue ?? 0;
        return value > this.activeThreshold ? value : 0;
    }

    /** Moves this plate's actual heat towards `target`, taking `glowRampSeconds` to climb from cold
     *  to fully on and `glowCooldownSeconds` to fall back, and returns the new value. A plate that
     *  is still cooling counts as heat for {@link CookingPot.addHeat} too, not just for the glow. */
    private advanceHeat(slot: number, target: number, deltaTime: number): number {
        const current = this._plateHeat[slot] ?? 0;
        const seconds = target > current ? this.glowRampSeconds : this.glowCooldownSeconds;
        const step = seconds > 0 ? deltaTime / seconds : 1;
        const next = Mathf.moveTowards(current, target, step);
        this._plateHeat[slot] = next;
        return next;
    }

    private updateGlow(slot: number, heat: number): void {
        const material = this._plateMaterials[slot];
        if (!material) return;
        // The tint stays constant; heat drives intensity down to 0, which reads as "off" without
        // needing a separate on/off switch.
        material.emissive.copy(this.glowColor);
        material.emissiveIntensity = heat * this.maxGlowIntensity;
    }
}
