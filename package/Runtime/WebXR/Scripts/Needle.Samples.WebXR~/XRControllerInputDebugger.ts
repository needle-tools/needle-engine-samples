import { Behaviour, Text, WebXR, findObjectOfType, serializable } from "@needle-tools/engine";

export class XRControllerInputDebugger extends Behaviour {
    @serializable(Text)
    label?: Text;

    private webXR?: WebXR;
    awake(): void {
        this.webXR = findObjectOfType(WebXR, this.scene, false);
    }

    update(): void {
        if (!this.webXR || !this.label) return;

        if (!this.context.isInXR) {
            this.label.text = "Enter XR to see controller input";
            return;
        }

        this.label.text = "";
        this.webXR.Controllers.forEach(controller => {
            controller.enableDefaultControls = false;
            controller.enableRaycasts = false;

            let text = `Controller: ${controller.input?.handedness}\n`;

            text += `\nSimple input:\n`;
            text += `Selection: ${controller.selectionPressed}\n`;

            const gamepad = controller.input?.gamepad;
            if (gamepad) {
                text += `\nAdvanced input:\n`;
                text += `Axes:\n${gamepad.axes.map((x, i) => `[${i}] ${x.toFixed(2)}`).join(", ")}\n`;
                text += `Buttons:\n${gamepad.buttons.map((x, i) => `[${i}] ${x.pressed}`).join(", ")}\n`;
            }

            this.label!.text += `${text}\n\n\n`;
        });
    }
}