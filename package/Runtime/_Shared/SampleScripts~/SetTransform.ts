import { Behaviour, Mathf, getWorldPosition, getWorldQuaternion, setWorldPosition, setWorldQuaternion } from "@needle-tools/engine";
import { Euler, Quaternion, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

const _tempPosition = new Vector3();
const _tempEuler = new Euler();
const _tempQuaternion = new Quaternion();
const _tempDelta = new Quaternion();

const _axisX = new Vector3(1, 0, 0);
const _axisY = new Vector3(0, 1, 0);
const _axisZ = new Vector3(0, 0, 1);

/**
 * Helper component to modify the transform of an object from events
 * (e.g. from a UI slider, a button click or any other UnityEvent).
 * All methods take a single number so they can be wired up directly in the editor.
 *
 * Every method comes in a Local and a World variant, and rotations are always in degrees.
 *
 * `set...` methods assign an absolute value:
 * - `setLocal...` is relative to the parent, like Unity's `localPosition` / `localEulerAngles`.
 * - `setWorld...` is relative to the scene, like Unity's `position` / `eulerAngles`.
 *   Setting a single rotation axis turns the object around exactly that world axis and leaves the other two alone.
 *
 * `translate...` and `rotate...` methods add to the current value:
 * - `translateLocal...` / `rotateLocal...` use the object's own axes, like Unity's `Space.Self`.
 * - `translateWorld...` / `rotateWorld...` use the scene axes, like Unity's `Space.World`.
 */
export class SetTransform extends Behaviour {

    // ---------------------------------------------------------------- position

    /** Sets the local X position (relative to the parent) */
    setLocalPositionX(value: number) {
        this.gameObject.position.x = value;
    }

    /** Sets the local Y position (relative to the parent) */
    setLocalPositionY(value: number) {
        this.gameObject.position.y = value;
    }

    /** Sets the local Z position (relative to the parent) */
    setLocalPositionZ(value: number) {
        this.gameObject.position.z = value;
    }

    /** Sets the X position in world space */
    setWorldPositionX(value: number) {
        this.setWorldPositionAxis("x", value, false);
    }

    /** Sets the Y position in world space */
    setWorldPositionY(value: number) {
        this.setWorldPositionAxis("y", value, false);
    }

    /** Sets the Z position in world space */
    setWorldPositionZ(value: number) {
        this.setWorldPositionAxis("z", value, false);
    }

    /** Moves the object along its own X axis */
    translateLocalX(amount: number) {
        this.gameObject.translateX(amount);
    }

    /** Moves the object along its own Y axis */
    translateLocalY(amount: number) {
        this.gameObject.translateY(amount);
    }

    /** Moves the object along its own Z axis */
    translateLocalZ(amount: number) {
        this.gameObject.translateZ(amount);
    }

    /** Moves the object along the world X axis */
    translateWorldX(amount: number) {
        this.setWorldPositionAxis("x", amount, true);
    }

    /** Moves the object along the world Y axis */
    translateWorldY(amount: number) {
        this.setWorldPositionAxis("y", amount, true);
    }

    /** Moves the object along the world Z axis */
    translateWorldZ(amount: number) {
        this.setWorldPositionAxis("z", amount, true);
    }

    // ---------------------------------------------------------------- rotation

    /** Sets the local rotation around the X axis in degrees (relative to the parent) */
    setLocalRotationX(degrees: number) {
        this.setLocalRotationAxis("x", degrees);
    }

    /** Sets the local rotation around the Y axis in degrees (relative to the parent) */
    setLocalRotationY(degrees: number) {
        this.setLocalRotationAxis("y", degrees);
    }

    /** Sets the local rotation around the Z axis in degrees (relative to the parent) */
    setLocalRotationZ(degrees: number) {
        this.setLocalRotationAxis("z", degrees);
    }

    /** Sets the rotation around the world X axis in degrees */
    setWorldRotationX(degrees: number) {
        this.setWorldRotationAxis("x", degrees);
    }

    /** Sets the rotation around the world Y axis in degrees */
    setWorldRotationY(degrees: number) {
        this.setWorldRotationAxis("y", degrees);
    }

    /** Sets the rotation around the world Z axis in degrees */
    setWorldRotationZ(degrees: number) {
        this.setWorldRotationAxis("z", degrees);
    }

    /** Rotates the object around its own X axis by the given amount in degrees */
    rotateLocalX(degrees: number) {
        this.gameObject.rotateX(degrees * Mathf.Deg2Rad);
    }

    /** Rotates the object around its own Y axis by the given amount in degrees */
    rotateLocalY(degrees: number) {
        this.gameObject.rotateY(degrees * Mathf.Deg2Rad);
    }

    /** Rotates the object around its own Z axis by the given amount in degrees */
    rotateLocalZ(degrees: number) {
        this.gameObject.rotateZ(degrees * Mathf.Deg2Rad);
    }

    /** Rotates the object around the world X axis by the given amount in degrees */
    rotateWorldX(degrees: number) {
        this.rotateAroundWorldAxis(_axisX, degrees);
    }

    /** Rotates the object around the world Y axis by the given amount in degrees */
    rotateWorldY(degrees: number) {
        this.rotateAroundWorldAxis(_axisY, degrees);
    }

    /** Rotates the object around the world Z axis by the given amount in degrees */
    rotateWorldZ(degrees: number) {
        this.rotateAroundWorldAxis(_axisZ, degrees);
    }

    // ---------------------------------------------------------------- internal

    /**
     * Euler angles are applied in the order given by their `order`, and three.js applies the *first* axis last.
     * Only that first axis is therefore a real rotation around that axis - the later ones turn around
     * axes that the earlier rotations already moved, which makes them behave like local rotations.
     * It is also the only component that is not clamped when decomposing, so it stays continuous over 0-360.
     * By decomposing with the axis we are about to set in front, setting a single axis does what it says.
     */
    //@nonSerialized
    private getEulerOrder(component: "x" | "y" | "z") {
        return component === "x" ? "XYZ" : component === "y" ? "YXZ" : "ZXY";
    }

    //@nonSerialized
    private setWorldPositionAxis(component: "x" | "y" | "z", value: number, relative: boolean) {
        const position = getWorldPosition(this.gameObject, _tempPosition);
        if (relative) position[component] += value;
        else position[component] = value;
        setWorldPosition(this.gameObject, position);
    }

    //@nonSerialized
    private setWorldRotationAxis(component: "x" | "y" | "z", degrees: number) {
        const rotation = getWorldQuaternion(this.gameObject, _tempQuaternion);
        _tempEuler.setFromQuaternion(rotation, this.getEulerOrder(component));
        _tempEuler[component] = degrees * Mathf.Deg2Rad;
        setWorldQuaternion(this.gameObject, _tempQuaternion.setFromEuler(_tempEuler));
    }

    //@nonSerialized
    private setLocalRotationAxis(component: "x" | "y" | "z", degrees: number) {
        _tempEuler.setFromQuaternion(this.gameObject.quaternion, this.getEulerOrder(component));
        _tempEuler[component] = degrees * Mathf.Deg2Rad;
        this.gameObject.quaternion.setFromEuler(_tempEuler);
    }

    //@nonSerialized
    private rotateAroundWorldAxis(axis: Vector3, degrees: number) {
        // build the rotation in world space so that rotated parents are handled correctly
        _tempDelta.setFromAxisAngle(axis, degrees * Mathf.Deg2Rad);
        const rotation = getWorldQuaternion(this.gameObject, _tempQuaternion);
        setWorldQuaternion(this.gameObject, rotation.premultiply(_tempDelta));
    }
}
