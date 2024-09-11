import { Behaviour } from "@needle-tools/engine";
import { FacefilterUtils } from "./utils";
import { Object3D } from "three";

/** 
 * Make the object an occluder for the face filter
 */
export class NeedleOcclusionMesh extends Behaviour {

    onEnable() {
        console.debug("Create Occluder")
        FacefilterUtils.makeOccluder(this.gameObject);
    }
}

export class NeedleBackgroundMesh extends Behaviour {

    private _previousParent: Object3D | null = null;

    awake(): void {
        this._previousParent = this.gameObject.parent;
    }

    onBeforeRender(): void {
        // The following is super ugly and just a hack
        // We reparent the mesh into the camera for one render call
        // then reparent back
        // But since the filter is removed during onBeforeRender the onAfterRender is not called anymore
        // And we do not receive a callback when the filter becomes inactive
        // So we need to check if the mesh is still in the scene...
        // Urgh
        if (!this.isInScene()) {
            return;
        }
        this.gameObject.matrixAutoUpdate = false;
        this._previousParent = this.gameObject.parent;
        this.context.mainCamera.add(this.gameObject);
    }
    onAfterRender(): void {
        this.context.mainCamera.remove(this.gameObject);
        if (this._previousParent) {
            this._previousParent.add(this.gameObject);
        }
    }

    private isInScene() {
        let current = this._previousParent;
        while (current) {
            if (current === this.context.scene) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }
}

