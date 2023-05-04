import { Behaviour, GameObject, OrbitControls, serializable } from "@needle-tools/engine";
import { getWorldPosition } from "@needle-tools/engine/src/engine/engine_three_utils";

// Documentation → https://docs.needle.tools/scripting

export class OrbitControlsView extends Behaviour {

    @serializable(GameObject)
    lookAt: GameObject;
    
    private controls: OrbitControls | null = null;

    onEnable(): void {
        this.controls = GameObject.findObjectOfType(OrbitControls);
    }

    setView() {
        if (!this.controls) return;

        this.controls.setTarget(getWorldPosition(this.lookAt));
        this.controls.setCameraTarget(getWorldPosition(this.gameObject));
    }
}