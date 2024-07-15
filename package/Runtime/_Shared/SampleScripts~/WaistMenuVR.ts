import { Behaviour, getTempVector, serializable, XRRig } from "@needle-tools/engine";
import * as THREE from "three";

const fwdVector = new THREE.Vector3(0, 0, 1);
const targetQuaternion = new THREE.Quaternion();
export class WaistMenuVR extends Behaviour {

    @serializable()
    snapping: boolean = true;

    @serializable()
    snapAngle: number = 45;

    @serializable()
    smoothing: boolean = true;

    @serializable()
    smoothingFactor: number = 5;

    @serializable(XRRig)
    rig?: XRRig;

    private lastSnappedAngle = 0;
    onBeforeRender() {
        const cam = this.context.xrCamera;

        if (!this.rig || !cam) return;

        const camFwd = cam.getWorldDirection(getTempVector());
        camFwd.y = 0;
        camFwd.normalize();
        camFwd.negate();
        
        // rotation
        if (this.snapping) {
            const sign = this.rig.right.dot(camFwd) > 0 ? 1 : -1;
            const angle = fwdVector.angleTo(camFwd) * THREE.MathUtils.RAD2DEG * sign; 
            const snappedAngle = Math.round(angle / this.snapAngle) * this.snapAngle;
            
            if (Math.abs(snappedAngle - this.lastSnappedAngle) > this.snapAngle * 1.5) {
                targetQuaternion.setFromAxisAngle(getTempVector(0, 1, 0), snappedAngle * THREE.MathUtils.DEG2RAD);
                this.lastSnappedAngle = snappedAngle;
            }
        }
        else {
            targetQuaternion.setFromUnitVectors(fwdVector, camFwd);
        }

        const dt = this.context.time.deltaTime;
        this.gameObject.quaternion.slerp(targetQuaternion, this.smoothing ? this.smoothingFactor * dt : 1);

        // position
        const camWP = cam.getWorldPosition(getTempVector()).negate();
        const rigWP = this.rig.worldPosition;
        this.gameObject.worldPosition = getTempVector(camWP.x, rigWP.y, camWP.z);
    }
}