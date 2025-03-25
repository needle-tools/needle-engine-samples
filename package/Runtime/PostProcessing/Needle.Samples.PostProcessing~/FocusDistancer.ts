import { Behaviour, DepthOfField, getParam, Gizmos, Mathf, serializable, Volume } from "@needle-tools/engine";
import { RaycastOptions } from "@needle-tools/engine";
import { Vector2 } from "three";

const debug = getParam("debugpost");

export class FocusDistancer extends Behaviour {

    @serializable(Volume)
    post!: Volume;

    @serializable()
    autoFocus: boolean = true;

    @serializable()
    displayDebugGizmo: boolean = true;

    private debugUI: HTMLDivElement | undefined;
    private slider: HTMLInputElement | undefined;
    private effect: DepthOfField | undefined;

    onEnable() {
        if (debug) this.createDebugUI();
    }

    onDisable() {
        if (this.debugUI) {
            this.debugUI.parentElement?.removeChild(this.debugUI);
            this.debugUI = undefined;
        }
    }

    onBeforeRender(): void {
        if (this.autoFocus || this.context.input.getPointerClicked(0)) {
            const profile = this.post?.sharedProfile;
            if (!profile) return;
            for (const ef of profile!.components!) {
                if (ef instanceof DepthOfField) {
                    let hits: any = undefined;
                    if (this.autoFocus) {
                        const rc = new RaycastOptions();
                        rc.screenPoint = new Vector2(0, 0);
                        hits = this.context.physics.raycast(rc);
                    }
                    else // raycasts at cursor position by default
                        hits = this.context.physics.raycast();

                    if (hits?.length) {
                        if(this.displayDebugGizmo) {
                            const gizmoDuration = this.autoFocus ? undefined : 1;
                            Gizmos.DrawWireSphere(hits[0].point, .05, 0x5588dd, gizmoDuration);
                        }

                        const hitInCam = this.context.mainCamera?.worldToLocal(hits[0].point);
                        const targetFocus = -hitInCam!.z;
                        if (this.autoFocus) {
                            const t = this.context.time.deltaTime / .05;
                            ef.focusDistance.value = Mathf.lerp(ef.focusDistance.value, targetFocus, t);
                        }
                        else {
                            ef.focusDistance.value = targetFocus;
                        }

                        // For debugging: show the value in the slider and make the effect adjustable
                        if (debug && this.slider) {
                            this.slider.value = ef.focusDistance.value.toString();
                            this.effect = ef;
                        }
                    }
                }
            }
        }
    }
    
    private createDebugUI() {
        const item = document.createElement("div");
        this.context.menu.appendChild(item);
        const label = document.createElement("label");
        label.innerText = "Auto focus";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = this.autoFocus;
        checkbox.onchange = () => {
            this.autoFocus = checkbox.checked;
        }
        label.appendChild(checkbox);
        item.appendChild(label);
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = this.context.mainCameraComponent?.nearClipPlane.toString() || "0";
        slider.max = this.context.mainCameraComponent?.farClipPlane.toString() || "50";
        slider.step = "0.01";
        item.appendChild(slider);
        slider.oninput = () => {
            const value = parseFloat(slider.value);
            this.autoFocus = false;
            checkbox.checked = false;
            if (this.effect) {
                this.effect.focusDistance.value = value;
            }
        };
        this.slider = slider;
        this.debugUI = item;
    }
}
