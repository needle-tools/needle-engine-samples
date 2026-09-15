import { Behaviour, DragControls, DragTarget, destroy, EventList, GameObject, getParam, serializable } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

/** Add `?debugcooking` to the URL to log this pot's cook cycle and why it is or is not cooking. */
const debug = getParam("debugcooking");

/**
 * Tracks how cooked this pot's contents are, on the pot itself rather than on whatever it is
 * placed on. Something else - typically an {@link OvenPlateController} - calls {@link addHeat}
 * once per frame while the pot sits on an active heat source, passing how much heat to add.
 *
 * Keeping the state here means a pot can be dragged onto any plate, swapped out mid-cook, moved
 * to a different oven entirely, or set down off any heat source, and its progress is never lost
 * or reset by whatever happens to be driving it.
 *
 * While cooking, every {@link DragControls} and {@link DragTarget} found on this object or its
 * children is disabled - the pot itself cannot be picked up off the plate, and nothing more can
 * be dropped into it - until either cooking finishes, when they are re-enabled, the vegetables
 * that were inside are destroyed, and `cookProgress` goes straight back to 0 so the same pot is
 * ready to cook again; or the pot stops receiving heat before that (the handle was turned back
 * down, or the pot left the slot some other way), when they are re-enabled and `cookProgress`
 * likewise goes back to 0 - a fresh attempt starts from nothing rather than picking up where a
 * half-finished one left off.
 *
 * The three events mark the cycle: {@link cookStarted} when it begins, {@link cooked} when it is
 * done, and {@link cookReset} when whatever `cooked` switched on should be switched off again -
 * which is when the pot is next used, not the instant it finished.
 */
export class CookingPot extends Behaviour {

    /** The DragTarget vegetables are dropped into. Leave unset if this pot should be considered
     *  ready to cook even empty. */
    @serializable(DragTarget)
    ingredients?: DragTarget;

    /** Seconds of heat at strength 1 needed to go from empty to fully cooked. */
    @serializable()
    cookTimeSeconds: number = 6;

    /** Raised once, the moment the pot locks in and actually starts cooking - not on every
     *  `addHeat` call, only when a fresh cook cycle begins. */
    @serializable(EventList)
    cookStarted: EventList = new EventList();

    /** Raised once, the moment `cookProgress` first reaches 1 - right before the vegetables are
     *  destroyed, dragging is re-enabled, and `cookProgress` itself is put back to 0 so the pot is
     *  ready to cook again. */
    @serializable(EventList)
    cooked: EventList = new EventList();

    /** Raised when the pot goes back to raw, to undo whatever `cooked` switched on. That is either
     *  a cook being abandoned before it finished, or - after one that did finish - whichever comes
     *  first of: the pot being taken off the plate, fresh ingredients dropped in, or a new cook
     *  starting. Deliberately not raised the instant a cook finishes, since firing it in the same
     *  frame as `cooked` would switch the finished state straight back off again.
     *
     *  Named `cookReset` rather than `reset` - Unity treats `Reset` as a reserved MonoBehaviour
     *  message (the editor-only callback fired when a component is added or reset from its
     *  context menu), so a generated component with a UnityEvent field literally called `Reset`
     *  has that field's Inspector binding silently go nowhere at runtime. */
    @serializable(EventList)
    cookReset: EventList = new EventList();

    private _cookProgress: number = 0;
    private _hasFiredCooked: boolean = false;
    private _locked: boolean = false;
    private _receivedHeatThisFrame: boolean = false;
    private _finishedCookToClear: boolean = false;
    private _unsubscribe?: Function;

    onEnable(): void {
        // Fresh ingredients mean a new batch, so the finished one stops being shown then - earlier
        // and more obviously than waiting for the plate to be turned back on.
        this._unsubscribe = this.ingredients?.objectDropped.addEventListener(() => {
            if (debug) console.log(`[Pot] ${this.name}: ingredient dropped in`, this.gameObject);
            this.clearFinishedCook();
        });
        if (debug) {
            console.log(`[Pot] ${this.name}: enabled - ingredients: `
                + `${this.ingredients ? "assigned" : "NOT assigned"}, listeners -> cookStarted: `
                + `${this.cookStarted.listenerCount}, cooked: ${this.cooked.listenerCount}, `
                + `cookReset: ${this.cookReset.listenerCount}`, this.gameObject);
        }
    }

    onDisable(): void {
        this._unsubscribe?.();
        this._unsubscribe = undefined;
    }

    /** 0-1, how done this pot's contents currently are. */
    get cookProgress(): number { return this._cookProgress; }

    /** True once fully cooked. */
    get isCooked(): boolean { return this._cookProgress >= 1; }

    /** True while cooking is in progress and this pot's DragControls/DragTarget components are
     *  disabled. */
    get isLocked(): boolean { return this._locked; }

    /** Whether this pot currently holds at least one vegetable. Always true if `ingredients`
     *  is not assigned, so a pot without a tracked slot is never blocked from cooking. */
    get hasIngredients(): boolean {
        return !this.ingredients || this.ingredients.occupants.length > 0;
    }

    /** Adds `strength` (0-1, a plate's current heat) worth of cooking for `deltaSeconds`. Locks
     *  the pot in place the moment cooking actually starts. No-op while `hasIngredients` is false
     *  or the pot is already `isCooked`. Meant to be called every frame the pot is on an active
     *  plate - `update` watches for a frame where it is not, and treats that as being released. */
    addHeat(strength: number, deltaSeconds: number): void {
        if (strength <= 0 || deltaSeconds <= 0) { this.logSkip("no heat passed in"); return; }
        if (this.isCooked) { this.logSkip("already cooked"); return; }
        if (!this.hasIngredients) { this.logSkip("no ingredients in the pot"); return; }
        this._lastSkip = "";
        this._receivedHeatThisFrame = true;
        if (!this._locked) {
            this.clearFinishedCook();
            this.setLocked(true);
            if (debug) console.log(`[Pot] ${this.name}: cooking started`, this.gameObject);
            this.cookStarted.invoke();
        }
        if (this.cookTimeSeconds <= 0) {
            this.setCookProgress(1);
            return;
        }
        this.setCookProgress(this._cookProgress + (strength * deltaSeconds) / this.cookTimeSeconds);
    }

    /** A locked, unfinished pot that went a whole frame without `addHeat` was released from its
     *  plate - by hand, by the handle being turned back down, or by anything else that stopped
     *  the heat - so it goes back to raw rather than staying stuck holding a half-finished cook
     *  it can no longer continue (dragging is disabled while locked, so the player could not have
     *  un-stuck it themselves). */
    update(): void {
        if (this._locked && !this._receivedHeatThisFrame && !this.isCooked) {
            if (debug) console.log(`[Pot] ${this.name}: released before finishing at `
                + `${(this._cookProgress * 100).toFixed(0)}% - going back to raw`, this.gameObject);
            this.resetCooking();
        }
        this._receivedHeatThisFrame = false;
    }

    /** Sets `cookProgress` directly (clamped to 0-1). Reaching 1 finishes cooking the same way
     *  reaching it through `addHeat` does. */
    setCookProgress(value: number): void {
        const clamped = Math.min(1, Math.max(0, value));
        if (clamped === this._cookProgress) return;
        this._cookProgress = clamped;
        if (this._cookProgress >= 1 && !this._hasFiredCooked) {
            this.finishCooking();
        }
    }

    /** Fires `cooked`, unlocks the pot, destroys whatever was cooking in it - and then, rather than
     *  sitting at `isCooked` forever, goes straight back to `cookProgress` 0. `addHeat` refuses to
     *  run at all once `isCooked`, so without this a pot could only ever be used once. */
    private finishCooking(): void {
        this._hasFiredCooked = true;
        if (debug) console.log(`[Pot] ${this.name}: cooked - invoking 'cooked' `
            + `(${this.cooked.listenerCount} listeners)`, this.gameObject);
        this.cooked.invoke();
        this.setLocked(false);
        this.destroyIngredients();

        this._hasFiredCooked = false;
        this._cookProgress = 0;
        // The state itself is raw again, but whatever `cooked` switched on is still being shown -
        // that stays until the pot is actually put back to use. See `cookReset`.
        this._finishedCookToClear = true;
    }

    /** Raises `cookReset` if a finished cook is still being shown, so it fires once and only for a
     *  pot that has something left to undo. Called when the pot leaves a heat source, when fresh
     *  ingredients go in, and when a new cook starts - whichever happens first. */
    clearFinishedCook(): void {
        if (!this._finishedCookToClear) return;
        this._finishedCookToClear = false;
        if (debug) console.log(`[Pot] ${this.name}: clearing the finished cook - invoking `
            + `'cookReset' (${this.cookReset.listenerCount} listeners)`, this.gameObject);
        this.cookReset.invoke();
    }

    /** Back to raw, for reuse with a fresh batch of vegetables. Also unlocks, in case this is
     *  called while cooking is still in progress rather than after it finished. Raises `cookReset`. */
    resetCooking(): void {
        this._hasFiredCooked = false;
        this._finishedCookToClear = false;
        this.setLocked(false);
        this.setCookProgress(0);
        if (debug) console.log(`[Pot] ${this.name}: resetCooking - invoking 'cookReset' `
            + `(${this.cookReset.listenerCount} listeners)`, this.gameObject);
        this.cookReset.invoke();
    }

    /** Logs why no cooking is happening, once per distinct reason rather than once per frame. */
    private _lastSkip: string = "";
    private logSkip(reason: string): void {
        if (!debug || reason === this._lastSkip) return;
        this._lastSkip = reason;
        console.log(`[Pot] ${this.name}: not cooking - ${reason}`, this.gameObject);
    }

    /** Enables/disables every DragControls and DragTarget on this object and its children. */
    private setLocked(locked: boolean): void {
        if (this._locked === locked) return;
        this._locked = locked;
        const enabled = !locked;
        for (const dc of GameObject.getComponentsInChildren(this.gameObject, DragControls)) dc.enabled = enabled;
        for (const dt of GameObject.getComponentsInChildren(this.gameObject, DragTarget)) dt.enabled = enabled;
    }

    private destroyIngredients(): void {
        if (!this.ingredients) return;
        // Copied out first: destroying an occupant removes it from the target, which would
        // otherwise mutate the same array this loop is reading.
        for (const veg of [...this.ingredients.occupants]) destroy(veg);
    }
}
