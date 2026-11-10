import { Behaviour, DragAxis, DragControls, DragMode, GameObject, PointerEventData, serializable } from "@needle-tools/engine";
import { MathUtils, Object3D, Plane, Quaternion, Ray, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

const _plane = new Plane();
const _point = new Vector3();
const _axis = new Vector3();
const _pivot = new Vector3();
const _dir = new Vector3();
const _a = new Vector3();
const _b = new Vector3();
const _quat = new Quaternion();
const _parentQuat = new Quaternion();

/**
 * Click the track behind a {@link DragControls} handle to move the handle there, like the
 * trough of a scrollbar. Put it on the parent object that holds the track or dial face.
 *
 * - {@link DragMode.Slide}: the handle moves to the clicked point along its axis.
 * - {@link DragMode.HingeRotate}: the handle turns until it points at the clicked point.
 *   {@link handleDirection} says where it points. A click on the handle itself turns it too, so a
 *   dial whose hub or ring is part of the handle mesh answers anywhere on its face.
 *
 * The handle moves through {@link DragControls.setValue}, which clamps to its range and fires its
 * value events. Clicks on any other DragControls below this object are left to them. Handled clicks
 * are used, so a quick second click does not count as a double-click that refocuses the camera.
 */
export class DragTrackClick extends Behaviour {

    /** The DragControls to move. Defaults to the first one below this object. */
    @serializable(DragControls)
    handle: DragControls | null = null;

    /** Hinge only: the direction the handle points at, in the handle's local space. */
    @serializable(Vector3)
    handleDirection: Vector3 = new Vector3(0, 0, 1);

    /** Hinge only: a click on the handle itself turns it only when it is more than this many degrees
     *  from where the handle points, so a click on the needle does not nudge it. */
    @serializable()
    handleClickAngle: number = 15;

    onPointerClick(args: PointerEventData): void {
        if (args.button !== 0 || !args.point) return;

        const drag = this.handle ?? GameObject.getComponentInChildren(this.gameObject, DragControls);
        if (!drag || !drag.activeAndEnabled) return;

        const hitControls = this.controlsAt(args.object);
        const onHandle = hitControls === drag;
        // The handle's own DragControls uses the event, so only a click on the track can be used already.
        if (hitControls && !onHandle) return;
        if (!onHandle && args.used) return;
        if (onHandle && drag.dragMode !== DragMode.HingeRotate) return;

        const value = this.valueAt(drag, args.point, args.event.ray, onHandle, args.isDoubleClick === true);
        if (value !== null) drag.setValue(value);
        args.use();
    }

    /** The first DragControls between the hit object and this object, or null for the track. */
    private controlsAt(hit: Object3D | undefined): DragControls | null {
        for (let o = hit; o && o !== this.gameObject; o = o.parent ?? undefined) {
            const controls = GameObject.getComponent(o, DragControls);
            if (controls) return controls;
        }
        return null;
    }

    /** The handle's value that puts it at `worldPoint`, or null to leave it where it is. */
    private valueAt(drag: DragControls, worldPoint: Vector3, ray: Ray, onHandle: boolean, doubleClick: boolean): number | null {
        const obj = drag.dragObject;
        const rest = drag.getRestPose();
        if (!rest) return null;
        switch (drag.dragMode) {
            case DragMode.Slide: {
                // Travel from the rest position along the axis, in the parent's units.
                if (!obj.parent) return null;
                obj.parent.updateWorldMatrix(true, false);
                _point.copy(worldPoint);
                obj.parent.worldToLocal(_point).sub(rest.position);
                return drag.axis === DragAxis.X ? _point.x : drag.axis === DragAxis.Y ? _point.y : _point.z;
            }
            case DragMode.HingeRotate: {
                if (!drag.getModeOrigin(_pivot) || !drag.getModeAxis(_axis)) return null;
                // Where the pointer ray crosses the hinge plane, not the surface it hit: the hub and the
                // face sit at different heights, and near the pivot that difference is a large angle.
                _plane.setFromNormalAndCoplanarPoint(_axis, _pivot);
                if (!ray.intersectPlane(_plane, _point)) _point.copy(worldPoint);
                _point.sub(_pivot);

                // A double-click's second press lands on the handle while it is still turning and stops
                // it there, so that one always finishes the turn.
                if (onHandle && !doubleClick) {
                    _dir.copy(this.handleDirection).applyQuaternion(obj.getWorldQuaternion(_quat));
                    const off = turn(_dir, _point, _axis);
                    if (off === null || Math.abs(off) <= this.handleClickAngle) return null;
                }

                // Measured from rest rather than from the current pose, so the same spot always gives
                // the same angle. The current value only picks the turn, for ranges past half a turn.
                _quat.copy(rest.quaternion);
                if (obj.parent) _quat.premultiply(obj.parent.getWorldQuaternion(_parentQuat));
                _dir.copy(this.handleDirection).applyQuaternion(_quat);
                const angle = turn(_dir, _point, _axis);
                if (angle === null) return null;
                const current = drag.currentValue;
                return current + ((angle - current) % 360 + 540) % 360 - 180;
            }
        }
        return null;
    }
}

/** Signed degrees from `from` to `to` about `axis`, both flattened onto the plane across it. Null
 *  when either lies on the axis. */
function turn(from: Vector3, to: Vector3, axis: Vector3): number | null {
    _a.copy(from).addScaledVector(axis, -from.dot(axis));
    _b.copy(to).addScaledVector(axis, -to.dot(axis));
    if (_a.lengthSq() < 1e-8 || _b.lengthSq() < 1e-8) return null;
    const cos = _a.dot(_b);
    const sin = axis.dot(_a.cross(_b));
    return MathUtils.radToDeg(Math.atan2(sin, cos));
}
