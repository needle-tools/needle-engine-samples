import { Behaviour, WebXR, findObjectOfType } from "@needle-tools/engine";

export class VibrateControllerExample extends Behaviour {
    private webXR?: WebXR;
    awake(): void {
        this.webXR = findObjectOfType(WebXR, this.scene, false)!;
    }

    update(): void {
        if(!this.webXR) return;

        for(const controller of this.webXR.Controllers)
        {
            const input = controller.input;
            if(!input) continue;
            const gamepad = input.gamepad;
            if(!gamepad) continue;

            let anyButtonDown = false;
            gamepad.buttons.forEach((button, i) => { 
                anyButtonDown ||= button.pressed;
            });

            if(anyButtonDown)
                gamepad.vibrationActuator?.playEffect("dual-rumble", { duration: 50, strongMagnitude: 1, weakMagnitude: 1 });
            else
                gamepad.vibrationActuator?.reset();
        };
    }
}