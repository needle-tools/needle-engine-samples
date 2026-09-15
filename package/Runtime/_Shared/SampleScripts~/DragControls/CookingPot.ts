import { Behaviour, DragTarget, EventList, serializable } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

/**
 * Tracks how cooked this pot's contents are, on the pot itself rather than on whatever it is
 * placed on. Something else - typically an {@link OvenPlateController} - calls {@link addHeat}
 * once per frame while the pot sits on an active heat source, passing how much heat to add.
 *
 * Keeping the state here means a pot can be dragged onto any plate, swapped out mid-cook, moved
 * to a different oven entirely, or set down off any heat source, and its progress is never lost
 * or reset by whatever happens to be driving it.
 */
export class CookingPot extends Behaviour {

    /** The {@link DragTarget} vegetables are dropped into. Leave unset if this pot should be
     *  considered ready to cook even empty. */
    @serializable(DragTarget)
    ingredients?: DragTarget;

    /** Seconds of heat at strength 1 needed to go from empty to fully cooked. */
    @serializable()
    cookTimeSeconds: number = 6;

    /** Raised whenever `cookProgress` changes, with the new 0-1 value. */
    @serializable(EventList)
    cookProgressChanged: EventList<number> = new EventList();

    /** Raised once, the moment `cookProgress` first reaches 1. Reset by `resetCooking`. */
    @serializable(EventList)
    cooked: EventList = new EventList();

    private _cookProgress: number = 0;
    private _hasFiredCooked: boolean = false;

    /** 0-1, how done this pot's contents currently are. */
    get cookProgress(): number { return this._cookProgress; }

    /** True once fully cooked. */
    get isCooked(): boolean { return this._cookProgress >= 1; }

    /** Whether this pot currently holds at least one vegetable. Always true if `ingredients`
     *  is not assigned, so a pot without a tracked slot is never blocked from cooking. */
    get hasIngredients(): boolean {
        return !this.ingredients || this.ingredients.occupants.length > 0;
    }

    /** Adds `strength` (0-1, a plate's current heat) worth of cooking for `deltaSeconds`. No-op
     *  while `hasIngredients` is false or the pot is already `isCooked`. */
    addHeat(strength: number, deltaSeconds: number): void {
        if (strength <= 0 || deltaSeconds <= 0) return;
        if (this.isCooked || !this.hasIngredients) return;
        if (this.cookTimeSeconds <= 0) {
            this.setCookProgress(1);
            return;
        }
        this.setCookProgress(this._cookProgress + (strength * deltaSeconds) / this.cookTimeSeconds);
    }

    /** Sets `cookProgress` directly (clamped to 0-1) and raises the events as needed. */
    setCookProgress(value: number): void {
        const clamped = Math.min(1, Math.max(0, value));
        if (clamped === this._cookProgress) return;
        this._cookProgress = clamped;
        this.cookProgressChanged.invoke(this._cookProgress);
        if (this._cookProgress >= 1 && !this._hasFiredCooked) {
            this._hasFiredCooked = true;
            this.cooked.invoke();
        }
    }

    /** Back to raw, for reuse with a fresh batch of vegetables. */
    resetCooking(): void {
        this._hasFiredCooked = false;
        this.setCookProgress(0);
    }
}
