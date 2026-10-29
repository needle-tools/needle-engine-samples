import {
    Behaviour, destroy, DragAllowDropEventArgs, DragControls, DragEndedEventArgs, DragMode, DragRotationMode,
    DragTarget, DragTargetAllowEventArgs, DragTargetEventArgs, EventList, GameObject, getBoundingBox, getParam,
    getTempQuaternion, getTempVector, instantiate, IPointerEventHandler, PointerEventData, Renderer, serializable,
    XRHoldBehaviour,
} from "@needle-tools/engine";
import { Box3, Mesh, Object3D, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

/** Add `?debugcarrotbed` to the URL to log planting, growth stages and harvesting. */
const debug = getParam("debugcarrotbed");

const _bedBounds = new Box3();

/** One seed taken from the pouch, from the moment it is spawned until it is harvested. */
type Plant = {
    /** The spawned seed. It stays the bed's occupant for the whole life of the plant, which is
     *  what keeps its slot taken while something grows there. */
    seed: Object3D,
    /** The slot the seed is planted in, or `-1` while it is loose. */
    slot: number,
    /** Index into {@link CarrotBedController.stages} currently showing, `-1` while still a seed. */
    stage: number,
    /** 0-1 through germination (stage `-1`) or through the current stage's growth. */
    progress: number,
    /** The clone of the current stage's template, or `null` while still a seed. */
    visual: Object3D | null,
    /** The visual's local scale at which it matches its template's size. */
    visualScale: Vector3,
    ripe: boolean,
    /** Removes the ripe visual's harvest listener. */
    unsubscribe: Function | null,
};

/**
 * Plant seeds from a pouch into a {@link DragTarget} bed and watch them grow, stage by stage, into
 * carrots that can be pulled out.
 *
 * 1. **Spawn** - pressing on {@link seedPouch} clones {@link seedTemplate} under the pointer and
 *    starts dragging it straight away. A seed let go anywhere but in a free bed slot is thrown away.
 * 2. **Plant** - once dropped into a free slot the seed can no longer be dragged and germinates
 *    for {@link germinationTime}.
 * 3. **Grow** - the seed is replaced by each of {@link stages} in turn, every one appearing at
 *    {@link startScale} of its template's size and growing to full size over
 *    {@link stageDuration}. A growing plant cannot be dragged either.
 * 4. **Harvest** - when the last stage is fully grown its own {@link DragControls} switch on, so
 *    the authored drag settings of that template (for example an engage threshold that makes the
 *    carrot resist being pulled out) are what the user feels. Let go anywhere off the bed, it
 *    counts as harvested and the slot is free. It can never be let go over the bed: it goes back
 *    to where that drag picked it up, which is its slot while it is still planted.
 *
 * The seed itself stays the slot's occupant until harvest - DragTarget has no way to hand a slot
 * over to a different object - so the stage visuals are clones parented under it, and the ripe one
 * moves out from under it before it can be picked up.
 *
 * The templates are scene objects: on awake they are hidden, and any stage template authored under
 * the bed is moved out of it so the bed does not adopt it as an occupant. The bed only accepts seeds
 * spawned here, and {@link DragTarget.swapOnFullSlot} is switched off, since swapping a seed into an
 * occupied slot would throw the plant growing there back to the pouch.
 *
 * Pointer events only reach a component from its own object or below, so this has to sit on
 * {@link seedPouch} or one of its parents - the root of the carrot bed, typically.
 */
export class CarrotBedController extends Behaviour implements IPointerEventHandler {

    /** The DragTarget whose slots seeds are planted in. */
    @serializable(DragTarget)
    bed: DragTarget | null = null;

    /** Pressing on this object, or anything below it, spawns a seed and starts dragging it. This
     *  component must be on this object or one of its parents to receive the press. */
    @serializable(Object3D)
    seedPouch: Object3D | null = null;

    /** The seed that gets cloned. Hidden at start. Gets a DragControls if it has none, so add one
     *  yourself to tune how seeds are dragged. */
    @serializable(Object3D)
    seedTemplate: Object3D | null = null;

    /** What a planted seed grows into, in order - for example the sprout, then the carrot. Hidden
     *  at start. Each stage is placed at the slot by its own origin. The DragControls of the last
     *  stage is what harvesting uses; one is added if it has none. */
    @serializable(Object3D)
    stages: Object3D[] = [];

    /** Seconds a planted seed waits before the first stage appears. */
    @serializable()
    germinationTime: number = 1.5;

    /** Seconds each stage takes to grow from its start scale to full size. */
    @serializable()
    stageDuration: number = 8;

    /** Size each stage appears at, as a fraction of its template's size. */
    @serializable()
    startScale: number = 0.25;

    /** Raised when a seed is dropped into a free slot. */
    @serializable(EventList)
    planted: EventList = new EventList();

    /** Raised when a plant reaches the end of its last stage and can be harvested. */
    @serializable(EventList)
    ripened: EventList = new EventList();

    /** Raised when a ripe plant is pulled out of the bed and its slot is free again. */
    @serializable(EventList)
    harvested: EventList = new EventList();

    /** Every seed spawned here and not yet harvested, keyed by the seed. */
    private readonly _plants = new Map<Object3D, Plant>();
    /** Seeds let go outside the bed, destroyed on the next update rather than from inside the drag
     *  that is still ending. */
    private readonly _discard: Object3D[] = [];
    /** Which spawned seed's DragControls each pointer's press was handed to, for its release. */
    private readonly _forwarded = new Map<Object3D, DragControls>();
    /** Where seeds are spawned and ripe plants are moved to: the seed template's own parent. */
    private _looseParent: Object3D | null = null;
    /** Each stage template's world scale, read before it is hidden. */
    private _stageScales: Vector3[] = [];
    private _unsubscribers: Function[] = [];

    awake(): void {
        if (!this.bed) {
            console.warn(`[CarrotBed] ${this.name}: no bed assigned`, this.gameObject);
            return;
        }
        this.bed.swapOnFullSlot = false;

        if (this.seedTemplate) {
            if (!this.seedTemplate.getComponent(DragControls)) {
                // The defaults Duplicatable gives a freshly spawned object: upright but turnable.
                const dc = this.seedTemplate.addComponent(DragControls);
                dc.dragMode = DragMode.SnapToSurfaces;
                dc.rotation = DragRotationMode.YawOnly;
                dc.xrHold = XRHoldBehaviour.FreeThenSnap;
            }
            this._looseParent = this.seedTemplate.parent;
            this.seedTemplate.visible = false;
        }
        else console.warn(`[CarrotBed] ${this.name}: no seed template assigned`, this.gameObject);

        if (this.stages.length === 0) console.warn(`[CarrotBed] ${this.name}: no growth stages assigned`, this.gameObject);
        const bedParent = this.bed.gameObject.parent;
        this._stageScales = this.stages.map(template => {
            if (!template) return new Vector3(1, 1, 1);
            // Awake runs before the bed's start, which is when it claims its children as occupants.
            if (bedParent && isSelfOrDescendant(template, this.bed!.gameObject)) bedParent.attach(template);
            const scale = template.worldScale.clone();
            template.visible = false;
            return scale;
        });

        if (this.seedPouch && !isSelfOrDescendant(this.seedPouch, this.gameObject))
            console.warn(`[CarrotBed] ${this.name}: the seed pouch is not this object or one of its children, `
                + `so pressing it will not spawn seeds`, this.gameObject);
    }

    onEnable(): void {
        const bed = this.bed;
        if (!bed) return;
        this._unsubscribers.push(
            bed.allowTarget.addEventListener(this.onAllowTarget),
            bed.objectDropped.addEventListener(this.onObjectDropped),
            bed.allowedObjectDragEnded.addEventListener(this.onDragEnded),
        );
    }

    onDisable(): void {
        for (const unsubscribe of this._unsubscribers) unsubscribe();
        this._unsubscribers.length = 0;
    }

    onDestroy(): void {
        for (const plant of this._plants.values()) plant.unsubscribe?.();
        this._plants.clear();
    }

    /** @internal Spawns a seed under the pointer and hands the press to its DragControls, the same
     *  way Duplicatable starts a drag on the clone it just made. */
    onPointerDown(args: PointerEventData): void {
        if (args.used || args.button !== 0) return;
        if (!this.seedPouch || !this.seedTemplate || !this.bed) return;
        if (!isSelfOrDescendant(args.object, this.seedPouch)) return;

        const seed = instantiate(this.seedTemplate, {
            parent: this._looseParent ?? undefined,
            position: args.point ?? this.seedPouch.worldPosition,
            rotation: this.seedTemplate.worldQuaternion,
            keepWorldPosition: true,
            visible: true,
        });
        // Registered before the drag begins: that is when the bed asks whether it accepts the seed.
        this._plants.set(seed, {
            seed, slot: -1, stage: -1, progress: 0, visual: null,
            visualScale: new Vector3(1, 1, 1), ripe: false, unsubscribe: null,
        });
        if (debug) console.log(`[CarrotBed] spawned ${seed.name}`, seed);

        const dc = seed.getComponent(DragControls);
        if (!dc) return;
        dc.onPointerDown(args);
        this._forwarded.set(args.event.space, dc);
    }

    /** @internal */
    onPointerUp(args: PointerEventData): void {
        const dc = this._forwarded.get(args.event.space);
        if (!dc) return;
        this._forwarded.delete(args.event.space);
        dc.onPointerUp(args);
    }

    update(): void {
        if (this._discard.length) {
            for (const seed of this._discard) destroy(seed);
            this._discard.length = 0;
        }

        const dt = this.context.time.deltaTime;
        for (const plant of this._plants.values()) {
            if (plant.slot < 0 || plant.ripe) continue;
            const duration = plant.stage < 0 ? this.germinationTime : this.stageDuration;
            plant.progress = duration > 0 ? Math.min(1, plant.progress + dt / duration) : 1;
            if (plant.visual) this.applyGrowth(plant);
            if (plant.progress >= 1) this.advance(plant);
        }
    }

    /** Only seeds spawned here go in the bed - not harvested carrots, not anything else. */
    private onAllowTarget = (e: DragTargetAllowEventArgs) => {
        if (!this._plants.has(e.object)) e.disallow();
    };

    private onObjectDropped = (e: DragTargetEventArgs) => {
        const plant = this._plants.get(e.object);
        if (!plant || plant.slot >= 0) return;
        plant.slot = e.slot;
        plant.progress = 0;
        // Through the drag mode rather than `enabled`: disabling the DragControls would also stop the
        // settle that is still easing the seed into the slot.
        for (const dc of GameObject.getComponentsInChildren(plant.seed, DragControls)) {
            dc.dragMode = DragMode.None;
            dc.xrDragMode = DragMode.None;
        }
        if (debug) console.log(`[CarrotBed] planted ${plant.seed.name} in slot ${e.slot}`, plant.seed);
        this.planted.invoke();
    };

    /** Arrives after objectDropped, so a seed that found no slot is still loose here. */
    private onDragEnded = (e: DragTargetEventArgs) => {
        const plant = this._plants.get(e.object);
        if (!plant || plant.slot >= 0) return;
        if (debug) console.log(`[CarrotBed] ${plant.seed.name} was not planted - discarding it`, plant.seed);
        this._plants.delete(plant.seed);
        this._discard.push(plant.seed);
    };

    /** Moves a plant on from germination or a fully grown stage to the next stage, or ripens it. */
    private advance(plant: Plant): void {
        if (plant.stage < 0) {
            // Sprouted: from here on the seed is only the slot's placeholder, so it is no longer drawn.
            plant.seed.traverse(o => { if ((o as Mesh).isMesh) Renderer.setVisible(o, false); });
        }
        const next = plant.stage + 1;
        if (next >= this.stages.length) {
            this.ripen(plant);
            return;
        }
        if (plant.visual) destroy(plant.visual);
        plant.visual = this.createVisual(plant, next);
        plant.stage = next;
        plant.progress = 0;
        if (plant.visual) this.applyGrowth(plant);
        if (debug) console.log(`[CarrotBed] slot ${plant.slot}: stage ${next} (${this.stages[next]?.name})`, plant.visual);
    }

    /** A clone of stage `index`'s template, standing at the plant's slot at its template's size,
     *  under the seed and with dragging switched off until it ripens. */
    private createVisual(plant: Plant, index: number): Object3D | null {
        const template = this.stages[index];
        if (!template || !this.bed) return null;
        const visual = instantiate(template, { parent: plant.seed, visible: true });
        for (const dc of GameObject.getComponentsInChildren(visual, DragControls)) dc.enabled = false;

        const position = this.bed.getSlotWorldPosition(plant.slot, getTempVector());
        if (position) visual.worldPosition = position;
        visual.worldQuaternion = this.bed.getSlotWorldQuaternion(plant.slot, getTempQuaternion());
        visual.worldScale = this._stageScales[index];
        plant.visualScale.copy(visual.scale);
        return visual;
    }

    private applyGrowth(plant: Plant): void {
        if (!plant.visual) return;
        const t = 1 - Math.pow(1 - plant.progress, 3);
        const start = Math.max(0, this.startScale);
        plant.visual.scale.copy(plant.visualScale).multiplyScalar(start + (1 - start) * t);
    }

    /** Fully grown: the visual moves out from under the seed - the seed is destroyed on harvest and
     *  would take it along - and its own DragControls switch on so it can be pulled out. */
    private ripen(plant: Plant): void {
        plant.ripe = true;
        const visual = plant.visual;
        if (debug) console.log(`[CarrotBed] slot ${plant.slot}: ripe`, visual);
        this.ripened.invoke();
        if (!visual) return;

        (this._looseParent ?? this.gameObject).attach(visual);
        const controls = GameObject.getComponentsInChildren(visual, DragControls);
        if (controls.length === 0) controls.push(visual.addComponent(DragControls));
        const unsubscribers = controls.map(dc => {
            dc.enabled = true;
            // Kept after the harvest, so the carrot can never be put back down on the bed.
            dc.allowDrop.addEventListener(this.onCarrotAllowDrop);
            return dc.dragEnded.addEventListener(e => this.tryHarvest(plant, e));
        });
        plant.unsubscribe = () => unsubscribers.forEach(unsubscribe => unsubscribe());
    }

    /** A carrot let go over the bed goes back to where that drag picked it up. */
    private onCarrotAllowDrop = (e: DragAllowDropEventArgs) => {
        if (this.isOverBed(e.position)) e.disallow();
    };

    /** Whether `position` is inside the bed's outline, seen from above. The plants are left out of
     *  the bed's bounds, so a tall carrot does not make the bed wider. */
    private isOverBed(position: Vector3): boolean {
        if (!this.bed) return false;
        const box = getBoundingBox(this.bed.gameObject, obj => this._plants.has(obj), undefined, _bedBounds);
        return position.x >= box.min.x && position.x <= box.max.x
            && position.z >= box.min.z && position.z <= box.max.z;
    }

    /** Harvested once the ripe plant is let go off the bed. A tug that springs back into place, or
     *  one let go over the bed, leaves it planted. */
    private tryHarvest(plant: Plant, e: DragEndedEventArgs): void {
        if (e.returning || !this.bed || !plant.visual) return;

        plant.unsubscribe?.();
        plant.unsubscribe = null;
        this._plants.delete(plant.seed);
        this.bed.releaseObject(plant.seed);
        destroy(plant.seed);
        if (debug) console.log(`[CarrotBed] harvested from slot ${plant.slot}`, plant.visual);
        this.harvested.invoke();
    }
}

function isSelfOrDescendant(node: Object3D | null | undefined, root: Object3D): boolean {
    for (let current = node; current; current = current.parent) {
        if (current === root) return true;
    }
    return false;
}
