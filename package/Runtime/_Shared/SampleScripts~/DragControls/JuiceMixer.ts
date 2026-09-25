import { Behaviour, DragControls, DragTarget, destroy, EventList, GameObject, getParam, serializable } from "@needle-tools/engine";
import { Object3D } from "three";

// Documentation → https://docs.needle.tools/scripting

/** Add `?debugmixer` to the URL to log every button press and why it did or did not make juice. */
const debug = getParam("debugmixer");

/**
 * Drives a juice mixer built from two {@link DragTarget}s and one push button.
 *
 * {@link ingredients} is the mixer's bowl - a {@link DragTarget} in `Area` mode. Give it a
 * **Capacity** above 0 in the inspector so {@link fillScale} has a real range to ramp across -
 * see that method for what happens while `Capacity` is left at 0 (unlimited).
 *
 * {@link lidTarget} is the socket on the mixer body the lid snaps into - assign the
 * {@link DragTarget} sitting on the mixer, not the lid itself. The lid is expected to carry its
 * own {@link DragControls} so it can be picked up and set down there; this component only ever
 * reads whether that target is occupied, via {@link hasLid}.
 *
 * {@link button} is a `Slide` mode {@link DragControls} read as a push button, the same
 * edge-triggered way `CassettePlayer.ts` reads its own transport buttons: watched for the moment
 * it *crosses* {@link pressThreshold} going up, once per physical push, rather than read live -
 * a button reads pressed for a single frame and would otherwise fire the mix over and over while
 * held down.
 *
 * {@link juiceObject} stays hidden (`GameObject.setActive(false)`) for as long as the mixer has
 * not been triggered - filling the bowl up, even all the way to `Capacity`, shows nothing by
 * itself. A press only makes juice while both {@link hasIngredients} and {@link hasLid} are true:
 * a bowl with at least one item and a lid on. When it does, every occupant of `ingredients` is
 * destroyed, `juiceObject` is switched on and scaled on its **Y** axis to {@link fillScale} of
 * however many ingredients were in the bowl at that exact moment - {@link minFillScale} for a
 * single item, ramping up to {@link maxFillScale} at a full bowl - and {@link juiceMade} fires
 * once. A press with nothing in the bowl, or no lid on, does nothing and fires nothing; run with
 * `?debugmixer` to see which reason it was.
 *
 * Dropping a fresh ingredient into `ingredients` after juice has been made hides `juiceObject`
 * again and starts a new batch, the same way `CookingPot.ts` clears its own finished state the
 * moment new ingredients go in.
 */
export class JuiceMixer extends Behaviour {

    /** The mixer's bowl - a `Area` mode {@link DragTarget}. */
    @serializable(DragTarget)
    ingredients!: DragTarget;

    /** The socket on the mixer body the lid is dropped into - the target that sits on the mixer,
     *  not any component on the lid. */
    @serializable(DragTarget)
    lidTarget!: DragTarget;

    /** The `Slide` mode push button that triggers mixing, read edge-triggered - see the class
     *  summary. */
    @serializable(DragControls)
    button!: DragControls;

    /** The finished glass. Hidden until a successful press; then switched on with its Y scale set
     *  once, from how full the bowl was at that moment - see the class summary. */
    @serializable(Object3D)
    juiceObject?: Object3D;

    /** `juiceObject`'s Y scale for a press made with a single ingredient in the bowl. */
    @serializable()
    minFillScale: number = 0.5;

    /** `juiceObject`'s Y scale for a press made with a full bowl (`Capacity` items). */
    @serializable()
    maxFillScale: number = 1;

    /** `button.normalizedValue` above this counts as pressed. */
    @serializable()
    pressThreshold: number = 0.5;

    /** Raised once, right after a successful press has destroyed the ingredients and switched
     *  `juiceObject` on. */
    @serializable(EventList)
    juiceMade: EventList = new EventList();

    private _hasJuice: boolean = false;
    private _buttonWasDown: boolean = false;
    private _unsubscribe?: Function;

    /** Whether `ingredients` currently holds at least one item. */
    get hasIngredients(): boolean {
        return !!this.ingredients && this.ingredients.occupants.length > 0;
    }

    /** Whether `ingredients` currently holds as many occupants as its `Capacity` allows. Always
     *  `false` while `Capacity` is left at 0 (unlimited) - there is nothing to be "full" of. Not
     *  required to press the button - see the class summary - but handy for other scripts that
     *  want to show a "bowl full" hint. */
    get isFull(): boolean {
        return !!this.ingredients && this.ingredients.capacity > 0
            && this.ingredients.occupants.length >= this.ingredients.capacity;
    }

    /** Whether the lid is currently sitting in `lidTarget`. */
    get hasLid(): boolean {
        return !!this.lidTarget && this.lidTarget.occupants.length > 0;
    }

    /** Whether the last press made juice that is still being shown. */
    get hasJuice(): boolean { return this._hasJuice; }

    onEnable(): void {
        // A fresh ingredient means a new batch - the juice object from the previous one stops
        // being shown as soon as it is clear another is being made, rather than lingering until
        // the next successful press.
        this._unsubscribe = this.ingredients?.objectDropped.addEventListener(() => this.clearJuice());

        // Force-hidden on enable regardless of how the scene was authored - juiceObject only
        // ever comes on through a successful press, never before.
        if (this.juiceObject) GameObject.setActive(this.juiceObject, false);
        this._hasJuice = false;

        // Read the button's starting position so a scene that happens to load already pressed
        // does not fire a spurious mix on the very first frame.
        this._buttonWasDown = this.isButtonDown();
        if (debug) {
            console.log(`[Mixer] ${this.name}: enabled - ingredients: `
                + `${this.ingredients ? "assigned" : "NOT assigned"} (capacity `
                + `${this.ingredients?.capacity ?? "?"}), lidTarget: `
                + `${this.lidTarget ? "assigned" : "NOT assigned"}, button: `
                + `${this.button ? "assigned" : "NOT assigned"}, juiceMade listeners: `
                + `${this.juiceMade.listenerCount}`, this.gameObject);
        }
    }

    onDisable(): void {
        this._unsubscribe?.();
        this._unsubscribe = undefined;
    }

    update(): void {
        if (!this.pressed()) return;

        if (debug && this.ingredients && this.ingredients.capacity <= 0) {
            console.warn(`[Mixer] ${this.name}: "${this.ingredients.name}" has Capacity 0 - `
                + `fillScale has no range to ramp across and will always return maxFillScale. `
                + `Set Capacity above 0 in the inspector.`, this.ingredients);
        }

        const filled = this.hasIngredients;
        const lidded = this.hasLid;
        if (!filled || !lidded) {
            if (debug) {
                console.log(`[Mixer] ${this.name}: pressed but not mixing - `
                    + `${filled ? "" : "bowl empty "}${lidded ? "" : "lid not on"}`.trim(),
                    this.gameObject);
            }
            return;
        }

        this.makeJuice();
    }

    /** Destroys every occupant of `ingredients`, switches `juiceObject` on scaled to
     *  {@link fillScale} of how many there were, and fires `juiceMade`. */
    private makeJuice(): void {
        const count = this.ingredients.occupants.length;

        // Copied out first: destroying an occupant removes it from the target, which would
        // otherwise mutate the same array this loop is reading.
        for (const item of [...this.ingredients.occupants]) destroy(item);

        if (this.juiceObject) {
            GameObject.setActive(this.juiceObject, true);
            this.juiceObject.scale.y = this.fillScale(count);
        }
        this._hasJuice = true;

        if (debug) console.log(`[Mixer] ${this.name}: juice made from ${count} ingredient(s), `
            + `scale ${this.fillScale(count).toFixed(2)} - invoking 'juiceMade' `
            + `(${this.juiceMade.listenerCount} listeners)`, this.gameObject);
        this.juiceMade.invoke();
    }

    /** `minFillScale` for a single ingredient, ramping linearly up to `maxFillScale` at
     *  `Capacity` ingredients. Returns `maxFillScale` outright while `Capacity` is 0 or 1 - there
     *  is no range to ramp across. */
    private fillScale(count: number): number {
        const capacity = this.ingredients.capacity;
        if (capacity <= 1) return this.maxFillScale;
        const t = Math.min(1, Math.max(0, (count - 1) / (capacity - 1)));
        return this.minFillScale + (this.maxFillScale - this.minFillScale) * t;
    }

    /** Hides `juiceObject` again and clears `hasJuice`, so the mixer is ready for another batch. */
    private clearJuice(): void {
        if (!this._hasJuice) return;
        this._hasJuice = false;
        if (this.juiceObject) GameObject.setActive(this.juiceObject, false);
        if (debug) console.log(`[Mixer] ${this.name}: fresh ingredient dropped in - juice cleared`, this.gameObject);
    }

    private isButtonDown(): boolean {
        return (this.button?.normalizedValue ?? 0) > this.pressThreshold;
    }

    /** True exactly on the frame the button's value crosses `pressThreshold` going up - never
     *  true again until it has sprung back out and been pushed a second time. */
    private pressed(): boolean {
        const down = this.isButtonDown();
        const wasDown = this._buttonWasDown;
        this._buttonWasDown = down;
        return down && !wasDown;
    }
}
