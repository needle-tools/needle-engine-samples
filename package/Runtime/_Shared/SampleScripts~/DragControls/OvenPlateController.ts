import { Behaviour, DragControls, DragTarget, EventList, GameObject, getParam, MaterialPropertyBlock, Mathf, Renderer, serializable } from "@needle-tools/engine";
import { Color, Material, MeshStandardMaterial, Object3D } from "three";
import { CookingPot } from "./CookingPot";

// Documentation → https://docs.needle.tools/scripting

/** Add `?debugcooking` to the URL to log what each plate is doing and which pot it is heating. */
const debug = getParam("debugcooking");

/**
 * Drives an electric cooker with two independent halves: the hob on top and the oven below.
 *
 * **Hob.** {@link plates} (a {@link DragTarget} in `Slots` mode) is where pots land, {@link handles}
 * are the `Hinge Rotation` {@link DragControls} that turn each plate on, and {@link plateRenderers}
 * are what glows to show it. All three lists are index-matched - `handles[i]` and
 * `plateRenderers[i]` both belong to `plates.slots[i]`. The glow itself goes on as a
 * `MaterialPropertyBlock` per plate rather than a cloned material, so every plate can glow to its
 * own heat off one shared material asset.
 *
 * **Oven.** {@link ovenHandle} turns it on and everything in {@link ovenTarget} bakes, however many
 * slots that target has - a shelf takes whatever fits rather than one dish per ring.
 * {@link onOvenActive} / {@link onOvenInactive} mark the oven compartment crossing
 * {@link activeThreshold} specifically - a plate turning on or off does not raise either.
 *
 * Either way a handle's {@link DragControls.normalizedValue} is only a *target* strength: the plate
 * or oven gets there over {@link glowRampSeconds} once turned up, and fades back over
 * {@link glowCooldownSeconds} once turned down, because an element has thermal mass and does not
 * snap to temperature. Anything above {@link activeThreshold} cooks the {@link CookingPot}s sitting
 * in it at its actual heat - including the residual heat while it is still cooling down.
 *
 * Three lamps say what is live: {@link platesLightMaterial} for the hob, {@link ovenLightMaterial}
 * for the oven's dashboard indicator, and {@link ovenInteriorLightMaterial} for the light inside
 * the oven cavity - the last two switch together, since both just mean "the oven is on". Each is
 * lit through its own material's emission. Unlike the plates and the oven's baking heat, a lamp is
 * electrical rather than thermal - it is a plain on/off switch, set straight from the handle each
 * frame with none of {@link glowRampSeconds} / {@link glowCooldownSeconds} and no dimming with how
 * far the handle is turned.
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

    /** Where dishes are put to bake - the shelf or rack inside the oven. Everything this target
     *  holds bakes together, in every slot it has. Leave unset for a hob with no oven. */
    @serializable(DragTarget)
    ovenTarget?: DragTarget;

    /** The Hinge Rotation handle that turns the oven on, read the same way as a plate handle. */
    @serializable(DragControls)
    ovenHandle?: DragControls;

    /** Raised once, the moment the oven itself crosses `activeThreshold` and starts baking. Not
     *  raised by a plate turning on - only the oven compartment. */
    @serializable(EventList)
    onOvenActive: EventList = new EventList();

    /** Raised once, the moment the oven itself drops back below `activeThreshold`. Not raised by a
     *  plate turning off - only the oven compartment. */
    @serializable(EventList)
    onOvenInactive: EventList = new EventList();

    /** Material of the lamp that is lit while any plate is on. Its emission is driven directly, so
     *  assign the material the lamp actually uses. */
    @serializable(Material)
    platesLightMaterial?: Material;

    /** Material of the dashboard lamp that is lit while the oven is baking. Its emission is driven
     *  directly, so assign the material the lamp actually uses. */
    @serializable(Material)
    ovenLightMaterial?: Material;

    /** Material of the lamp inside the oven cavity, lighting the food while it bakes - the same
     *  on/off switch as `ovenLightMaterial`, just a second, separate material to drive. Optional;
     *  leave unset for an oven with no interior light. */
    @serializable(Material)
    ovenInteriorLightMaterial?: Material;

    /** Emissive tint of the hob's indicator lamp at full strength. */
    @serializable(Color)
    platesLightColor: Color = new Color(1, 0.15, 0.05);

    /** Emissive tint of the oven's dashboard indicator lamp at full strength. */
    @serializable(Color)
    ovenLightColor: Color = new Color(1, 0.45, 0.05);

    /** Emissive intensity of an indicator lamp while lit. 0 while off - there is nothing in between. */
    @serializable()
    maxControlLightIntensity: number = 2;

    /** HDR emissive colour of the oven's interior lamp while lit, black while off - there is nothing
     *  in between. An HDR colour rather than `ovenLightColor` + `maxControlLightIntensity`: this
     *  one lights the inside of the cavity itself rather than a small dashboard lens, so it is set
     *  on `ovenInteriorLightMaterial` as-is, with brightness baked into the colour instead of a
     *  shared intensity multiplier - pick components above 1 to push it brighter. */
    @serializable(Color)
    ovenInteriorLightColor: Color = new Color(3, 1.4, 0.3);

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

    private readonly _plateBlocks: (MaterialPropertyBlock<MeshStandardMaterial> | undefined)[] = [];
    private readonly _plateHeat: number[] = [];
    private readonly _wasActive: boolean[] = [];
    private readonly _lastOccupant: (Object3D | null)[] = [];
    private readonly _unsubscribe: Function[] = [];
    private _ovenHeat: number = 0;
    private _ovenWasActive: boolean = false;

    onEnable(): void {
        // A pot taken out is done with whatever cooked it: the finished state it is still showing
        // gets cleared here rather than lingering until the pot is next used.
        for (const target of [this.plates, this.ovenTarget]) {
            const unsubscribe = target?.objectRemoved.addEventListener(args => {
                const pot = this.findPot(args.object);
                if (debug) console.log(`[Oven] "${args.object?.name}" removed from `
                    + `${target === this.ovenTarget ? "the oven" : `plate ${args.slot}`}`
                    + `${pot ? "" : " (no CookingPot)"}`, args.object);
                pot?.clearFinishedCook();
            });
            if (unsubscribe) this._unsubscribe.push(unsubscribe);
        }

        this._plateBlocks.length = 0;
        this._plateHeat.length = 0;
        for (const renderer of this.plateRenderers) {
            this._plateHeat.push(0);
            // A property block per plate's object rather than a cloned material: the shared material
            // itself is never touched, so every plate keeps glowing independently off the one asset.
            this._plateBlocks.push(renderer
                ? MaterialPropertyBlock.get<MeshStandardMaterial>(renderer.gameObject)
                : undefined);
        }
    }

    update(): void {
        const deltaTime = this.context.time.deltaTime;
        this.updatePlates(deltaTime);
        this.updateOven(deltaTime);
        // Driven by the handles directly, not by `_plateHeat`/`_ovenHeat` - a lamp is electrical,
        // not thermal, so unlike the plates and the oven's own baking heat it has no business
        // ramping in and out, or dimming with the dial. It is a switch: on the instant any handle
        // clears `activeThreshold`, off the instant none do.
        this.updateLight(this.platesLightMaterial, this.platesLightColor, this.anyPlateActive());
        const ovenOn = this.strengthOf(this.ovenHandle) > 0;
        this.updateLight(this.ovenLightMaterial, this.ovenLightColor, ovenOn);
        this.updateHdrLight(this.ovenInteriorLightMaterial, this.ovenInteriorLightColor, ovenOn);
    }

    /** Whether any plate handle is past `activeThreshold` right now (unramped) - what lights the
     *  hob's indicator lamp. */
    private anyPlateActive(): boolean {
        if (!this.plates) return false;
        const count = Math.min(this.handles.length, this.plates.slotCount);
        for (let slot = 0; slot < count; slot++) {
            if (this.strengthAt(slot) > 0) return true;
        }
        return false;
    }

    /** Runs every plate, ramping each one's heat and cooking whatever sits on it. */
    private updatePlates(deltaTime: number): void {
        if (!this.plates) {
            if (debug) console.warn("[Oven] no plates DragTarget assigned", this);
            return;
        }
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

    /** Bakes everything on the oven shelf, ramping the oven's own heat. */
    private updateOven(deltaTime: number): void {
        const heat = this._ovenHeat = this.rampHeat(
            this._ovenHeat, this.strengthOf(this.ovenHandle), deltaTime);

        const active = heat > this.activeThreshold;
        if (active !== this._ovenWasActive) {
            this._ovenWasActive = active;
            if (debug) {
                console.log(`[Oven] baking ${active ? "ON" : "off"} - handle `
                    + `${this.strengthOf(this.ovenHandle).toFixed(2)}, heat ${heat.toFixed(2)}`);
            }
            if (active) this.onOvenActive.invoke();
            else this.onOvenInactive.invoke();
        }
        if (!active || !this.ovenTarget) return;

        // Copied out: `occupants` hands back a buffer the target reuses, and cooking a pot can put
        // it through its finish, which reads occupancy again.
        for (const occupant of [...this.ovenTarget.occupants]) {
            this.findPot(occupant)?.addHeat(heat, deltaTime);
        }
    }

    onDisable(): void {
        for (const unsubscribe of this._unsubscribe) unsubscribe();
        this._unsubscribe.length = 0;
        // Property block overrides outlive this behaviour otherwise - without this a disabled
        // controller would leave its plates stuck glowing at whatever heat they were last at.
        for (const block of this._plateBlocks) block?.clearAllOverrides();
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
        return this.strengthOf(this.handles[slot]);
    }

    /** What a handle is asking for: its `normalizedValue`, or 0 below {@link activeThreshold}. */
    private strengthOf(handle: DragControls | undefined | null): number {
        const value = handle?.normalizedValue ?? 0;
        return value > this.activeThreshold ? value : 0;
    }

    /** Moves this plate's actual heat towards `target` and returns the new value. */
    private advanceHeat(slot: number, target: number, deltaTime: number): number {
        const next = this.rampHeat(this._plateHeat[slot] ?? 0, target, deltaTime);
        this._plateHeat[slot] = next;
        return next;
    }

    /** One step of an element's thermal mass: {@link glowRampSeconds} to climb from cold to fully
     *  on, {@link glowCooldownSeconds} to fall back. Whatever is still cooling counts as heat for
     *  {@link CookingPot.addHeat} too, not just for the glow. */
    private rampHeat(current: number, target: number, deltaTime: number): number {
        const seconds = target > current ? this.glowRampSeconds : this.glowCooldownSeconds;
        const step = seconds > 0 ? deltaTime / seconds : 1;
        return Mathf.moveTowards(current, target, step);
    }

    private updateGlow(slot: number, heat: number): void {
        const block = this._plateBlocks[slot];
        if (!block) return;
        // The tint stays constant; heat drives intensity down to 0, which reads as "off" without
        // needing a separate on/off switch. Both go on as property block overrides rather than onto
        // a material directly, so the plate's own material is never mutated or cloned.
        block.setOverride("emissive", this.glowColor);
        block.setOverride("emissiveIntensity", heat * this.maxGlowIntensity);
    }

    /** Switches an indicator lamp fully on or fully off in its own colour - no ramping, no dimming
     *  with the handle, see the note in `update`. The material is written to as it was assigned,
     *  not cloned like the plates are: a lamp's material is the one its mesh is already drawing
     *  with, and a clone would leave the lamp showing the untouched original. */
    private updateLight(material: Material | undefined, color: Color, on: boolean): void {
        const lamp = material as MeshStandardMaterial | undefined;
        if (!lamp?.emissive) return;
        lamp.emissive.copy(color);
        lamp.emissiveIntensity = on ? this.maxControlLightIntensity : 0;
    }

    /** Same switch as `updateLight`, but for a colour that is already HDR - brightness lives in
     *  `color` itself, so it goes onto `emissive` as-is with `emissiveIntensity` left at 1 rather
     *  than being scaled by `maxControlLightIntensity`. */
    private updateHdrLight(material: Material | undefined, color: Color, on: boolean): void {
        const lamp = material as MeshStandardMaterial | undefined;
        if (!lamp?.emissive) return;
        if (on) lamp.emissive.copy(color);
        else lamp.emissive.setScalar(0);
        lamp.emissiveIntensity = 1;
    }
}
