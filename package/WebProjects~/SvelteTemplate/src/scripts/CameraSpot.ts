import { Behaviour, GameObject, IPointerClickHandler } from "@needle-tools/engine";
import { StateManager } from "./StateManager";

export class CameraSpot extends Behaviour implements IPointerClickHandler {

    private startScale: number = 1;

    start() {
        this.startScale = this.gameObject.scale.x;
    }
 
    deselect() {
        this.gameObject.scale.set(this.startScale, this.startScale, this.startScale);
    }
    
    select() {
        const sc = this.startScale * 1.3;
        this.gameObject.scale.set(sc, sc, sc);
    }

    onPointerClick() {
        const stateManager = GameObject.findObjectOfType(StateManager);
        stateManager?.dispatchEvent(new CustomEvent(StateManager.CameraSpotClickedEvent, { detail: this }));
    }
}