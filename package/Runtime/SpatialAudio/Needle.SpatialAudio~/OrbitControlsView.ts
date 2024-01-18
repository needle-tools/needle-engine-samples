import { Behaviour, GameObject, OrbitControls, serializable } from "@needle-tools/engine";
import { getWorldPosition } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class OrbitControlsView extends Behaviour {

    @serializable(GameObject)
    lookAt?: GameObject;
    
    private controls: OrbitControls | null = null;

    onEnable(): void {
        this.controls = GameObject.findObjectOfType(OrbitControls);
    }

    setView() {
        if (!this.controls || !this.lookAt) return;

        this.controls.setLookTargetPosition(getWorldPosition(this.lookAt));
        this.controls.setCameraTargetPosition(getWorldPosition(this.gameObject));
    }
}