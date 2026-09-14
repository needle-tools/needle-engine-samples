import { Behaviour, EventList, serializable } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

/**
 * Converts an incoming number to a bool by comparing it against {@link threshold}, and raises
 * {@link valueChanged} with the result.
 *
 * Wire a numeric UnityEvent to {@link setValue} - most commonly {@link DragControls.valueChanged}
 * or {@link DragControls.valueChangedNormalized} (a lever, slider or drawer's drag amount) - and
 * wire {@link valueChanged} on to anything expecting a bool, such as
 * {@link ChessLogic.setPlayModeActive}.
 *
 * @example A lever past 50% enables something
 * ```ts
 * const converter = leverObject.addComponent(NumberToBoolConverter);
 * converter.threshold = 0.5;
 * dragControls.valueChangedNormalized.addEventListener(v => converter.setValue(v));
 * converter.valueChanged.addEventListener(on => console.log("lever is", on ? "on" : "off"));
 * ```
 
 */
export class NumberToBoolConverter extends Behaviour {

    /** The incoming value must be at least this to convert to true. */
    @serializable()
    threshold: number = 0.5;

    /** Invoked with the converted bool, only when it actually changes from the previous call. */
    @serializable(EventList)
    valueChanged: EventList<boolean> = new EventList();

    /** Invoked (no payload) whenever the converted value changes to true. Bindable from the Unity Inspector. */
    @serializable(EventList)
    onTrue: EventList = new EventList();

    /** Invoked (no payload) whenever the converted value changes to false. Bindable from the Unity Inspector. */
    @serializable(EventList)
    onFalse: EventList = new EventList();

    private _currentValue: boolean | null = null;

    /** Converts `value` against {@link threshold} and raises {@link valueChanged}/{@link onTrue}/{@link onFalse} if the result changed. */
    setValue(value: number): void {
        const result = value >= this.threshold;
        if (result === this._currentValue) return;
        this._currentValue = result;
        this.valueChanged.invoke(result);
        if (result) this.onTrue.invoke();
        else this.onFalse.invoke();
    }
}
