import { Behaviour } from "@needle-tools/engine";
import { CameraSpot } from "./CameraSpot";

export class StateManager extends Behaviour {

    static StateChangedEvent = "stateChanged";
    static CameraSpotClickedEvent = "cameraSpotClicked";

    start(): void {
        this.addEventListener(StateManager.StateChangedEvent, (e: CustomEvent) => {
            console.log("state changed!", e.detail);
        }); 
    }
}