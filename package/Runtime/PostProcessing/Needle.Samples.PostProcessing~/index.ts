

import { Behaviour, DepthOfField, Gizmos, serializable, Volume } from "@needle-tools/engine";
import { RaycastOptions } from "@needle-tools/engine/src/engine/engine_physics";
import { Vector2 } from "three";

export class FocusDistancer extends Behaviour {

    @serializable(Volume)
    post!: Volume;

    @serializable()
    autoFocus: boolean = true;

    onBeforeRender(): void {
        if (this.autoFocus || this.context.input.getPointerClicked(0)) {
            const profile = this.post?.sharedProfile;
            if (!profile) return;
            for (const ef of profile!.components!) {
                if (ef instanceof DepthOfField) {
                    let hits: any = undefined;
                    if (this.autoFocus) {
                        const rc = new RaycastOptions();
                        rc.screenPoint = new Vector2(0,0);
                        hits = this.context.physics.raycast(rc);
                    }
                    else // raycasts at cursor position by default
                        hits = this.context.physics.raycast();

                    if (hits?.length) {
                        Gizmos.DrawWireSphere(hits[0].point, .05, 0x5588dd);
                        const hitInCam = this.context.mainCamera?.worldToLocal(hits[0].point);
                        ef.focusDistance.value = -hitInCam!.z;
                    }
                }
            }
        }
    }
}
