import { Behaviour, DragControls, serializable } from "@needle-tools/engine";
import { Quaternion, Vector3 } from "three";

import { FloorPlanRoom } from "./FloorPlanRoom.js";
import { TextPlane } from "./TextPlane.js";

// Documentation → https://docs.needle.tools/scripting

const _up = new Vector3(0, 1, 0);
const _quat = new Quaternion();

/**
 * The root of a floor plan model. Shows the total area of all FloorPlanRoom pieces below it, and
 * turns released furniture to the nearest quarter turn so it lines up with the walls.
 */
export class FloorPlan extends Behaviour {

    /** Shows the total floor area of all rooms. Optional. */
    @serializable(TextPlane)
    totalLabel?: TextPlane;

    /** Turn furniture to the nearest quarter turn when it is released. */
    @serializable()
    snapFurnitureRotation: boolean = true;

    private _rooms: FloorPlanRoom[] = [];
    private readonly _offs: Function[] = [];

    onEnable(): void {
        this._rooms = this.gameObject.getComponentsInChildren(FloorPlanRoom);
        // Everything draggable that is not a room counts as furniture.
        for (const drag of this.gameObject.getComponentsInChildren(DragControls)) {
            if (drag.gameObject.getComponent(FloorPlanRoom)) continue;
            this._offs.push(drag.dragEnded.addEventListener(() => this.snapRotation(drag)));
        }
    }

    onDisable(): void {
        for (const off of this._offs) off();
        this._offs.length = 0;
    }

    update(): void {
        if (!this.totalLabel) return;
        let total = 0;
        for (const room of this._rooms) if (room.activeAndEnabled) total += room.area;
        this.totalLabel.setText(`TOTAL  ${total.toFixed(1)} m²`);
    }

    private snapRotation(drag: DragControls): void {
        if (!this.snapFurnitureRotation) return;
        const obj = drag.gameObject;
        // Furniture only turns about the up axis, so the quaternion holds a single yaw angle.
        const q = obj.quaternion;
        const yaw = 2 * Math.atan2(q.y, q.w);
        const snapped = Math.round(yaw / (Math.PI / 2)) * (Math.PI / 2);
        obj.quaternion.copy(_quat.setFromAxisAngle(_up, snapped));
    }
}
