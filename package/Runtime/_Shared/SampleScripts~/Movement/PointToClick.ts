import { Behaviour, OrbitControls, getTempVector, serializable, setWorldPosition, setWorldQuaternion } from "@needle-tools/engine";
import { Vector3, Object3D } from "three";

const upVector = new Vector3(0, 1, 0);

export class PointToClick extends Behaviour {
    @serializable()
    pointerId: number = 0;

    @serializable()
    moveOnClick: boolean = true;

    @serializable(Vector3)
    offset: Vector3 = new Vector3();

    @serializable()
    dotLimit: number = -2;

    /* private tempObjMarker?: Object3D; */
    private clickStamp = 0;

    awake(): void {
        /* this.tempObjMarker = new Object3D();
        this.tempObjMarker.name = `PointToClickMarker - ${this.gameObject.uuid}`;
        this.context.scene.children[0]?.add(this.tempObjMarker); */
    }

    update() {
        const input = this.context.input;
        const time = this.context.time.time;

        // save time stamp of clicks
        if (input.getPointerClicked(this.pointerId)) {
            this.clickStamp = time;
        }

        // if last click occured after double click threshold and pointer is not pressed
        const lastDownStamp = input.getPointerDownTime(this.pointerId);
        const lastDownWasClick = lastDownStamp - this.clickStamp > input._doubleClickTimeThreshold;
        if (lastDownWasClick && !input.getPointerPressed(this.pointerId)) {
            this.clickStamp = Number.MAX_SAFE_INTEGER;
            if (this.moveOnClick) {
                this.move();
            }
        }       
    }

    move() {
        // raycast from pointer
        const hit = this.context.physics.raycast().at(0);

        // discard hit if invalid or dot check
        if (!hit || (hit.normal && hit.normal.dot(upVector) < this.dotLimit)){
            return;
        }

        // move to hit point
        const controls = this.gameObject.getComponent(OrbitControls);
        const wPos = getTempVector(hit.point).add(this.offset);

        if (controls) {
            controls.setCameraTargetPosition(wPos);
            
            const fwd = controls.gameObject.worldForward.negate();
            const up = controls.gameObject.worldUp;

            // 1 : 0.35
            const wLookPos = getTempVector(wPos).add(fwd).add(up.setLength(0.35));

            controls.setLookTargetPosition(wLookPos);
        }
        else {
            // TODO: implement interpolation
            this.gameObject.worldPosition = wPos;
        }
    }
}