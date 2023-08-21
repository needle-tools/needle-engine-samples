import { Behaviour, GameObject, OrbitControls, serializable, Image } from "@needle-tools/engine";
import { LinesDrawer } from "./LineDrawer";

export class LinesControl extends Behaviour {

    @serializable(OrbitControls)
    orbit?: OrbitControls;

    @serializable(Image)
    orbitUI?: Image;

    @serializable(LinesDrawer)
    lines!: LinesDrawer;

    @serializable(Image)
    linesUI?: Image;

    @serializable()
    defaultState: boolean = true;

    start() {
        this.setDrawingMode(this.defaultState);
    }

    setDrawingMode(state: boolean) {
        if(!this.orbit || !this.orbitUI || !this.lines || !this.linesUI) return;

        this.orbit.enabled = !state;
        this.orbitUI.color.a = !state ? 0.8 : 0.3;

        this.lines.enabled = state;
        this.linesUI.color.a = state ? 0.8 : 0.3;

        console.log("orbit", this.orbit.enabled, "lines", this.lines.enabled);
    }
}