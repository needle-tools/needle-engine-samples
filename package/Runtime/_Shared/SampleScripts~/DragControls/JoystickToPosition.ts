import { Behaviour, DragControls, serializable } from "@needle-tools/engine";
import { Object3D, Vector2, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

/** Which of {@link DragControls.normalizedAngles}' three entries to read. */
export enum JoystickAxis {
    X = 0,
    Y = 1,
    Z = 2,
}

/**
 * Drives {@link target}'s local X/Y position from a single two-axis {@link DragMode.Rotate} joystick.
 *
 * A joystick built with {@link DragMode.Rotate} leans on up to three parent-local axes at once -
 * see {@link DragRotationAxis} - and reports each one's swing as {@link DragControls.normalizedAngles},
 * `0…1` across that axis's own authored range. This takes two of those three entries (forward/back
 * and left/right - {@link xAxis} and {@link yAxis}, `X`/`Z` by default, leaving `Y` free for a twist
 * that does not move anything) and remaps them onto {@link rangeX} / {@link rangeY}, writing the
 * result straight to the target's local position every frame.
 *
 * Set up the joystick itself with {@link DragRotationAxis.enabled} off for whichever axis is not in
 * use - a two-axis joystick has exactly one axis switched off - then assign it here and leave
 * {@link target} empty to move this object itself.
 *
 * @example Joystick leaning on X (forward/back) and Z (left/right) driving a cursor within a 20cm square
 * ```ts
 * const driver = cursor.addComponent(JoystickToPosition);
 * driver.joystick = joystick;
 * driver.rangeX.set(-0.1, 0.1);
 * driver.rangeY.set(-0.1, 0.1);
 * ```
 */
export class JoystickToPosition extends Behaviour {

    /** The {@link DragMode.Rotate} joystick to read. */
    @serializable(DragControls)
    joystick: DragControls | null = null;

    /** Object to move. Defaults to this object. */
    @serializable(Object3D)
    target: Object3D | null = null;

    /** Which {@link joystick} axis drives local X. */
    @serializable()
    xAxis: JoystickAxis = JoystickAxis.X;

    /** Which {@link joystick} axis drives local Y. */
    @serializable()
    yAxis: JoystickAxis = JoystickAxis.Z;

    /** Local X range: `x` is written when {@link xAxis} reads normalized `0`, `y` at normalized `1`. */
    @serializable(Vector2)
    rangeX: Vector2 = new Vector2(-1, 1);

    /** Local Y range: `x` is written when {@link yAxis} reads normalized `0`, `y` at normalized `1`. */
    @serializable(Vector2)
    rangeY: Vector2 = new Vector2(-1, 1);

    /** Flip {@link xAxis}'s normalized value before mapping it onto {@link rangeX}. */
    @serializable()
    invertX: boolean = false;

    /** Flip {@link yAxis}'s normalized value before mapping it onto {@link rangeY}. */
    @serializable()
    invertY: boolean = false;

    update(): void {
        if (!this.joystick) return;
        const t = this.target ?? this.gameObject;
        const angles = this.joystick.normalizedAngles;

        const nx = this.invertX ? 1 - this._read(angles, this.xAxis) : this._read(angles, this.xAxis);
        t.position.x = this.rangeX.x + (this.rangeX.y - this.rangeX.x) * nx;

        const ny = this.invertY ? 1 - this._read(angles, this.yAxis) : this._read(angles, this.yAxis);
        t.position.y = this.rangeY.x + (this.rangeY.y - this.rangeY.x) * ny;
    }

    private _read(angles: Vector3, axis: JoystickAxis): number {
        switch (axis) {
            case JoystickAxis.X: return angles.x;
            case JoystickAxis.Y: return angles.y;
            case JoystickAxis.Z: return angles.z;
        }
    }
}
