import { Behaviour, isMobileDevice, serializable } from "@needle-tools/engine";
import nipplejs from "nipplejs";
import { FirstPersonController } from "./FirstPersonCharacter";
import { Vector2 } from "three";

export class MobileControls extends Behaviour {

    @serializable(FirstPersonController)
    controller?: FirstPersonController;

    movementSensitivity: number = 1;
    lookSensitivity: number = 5;

    // See https://github.com/yoannmoinet/nipplejs for all options
    private _movement?: nipplejs.JoystickManager;
    private _look?: nipplejs.JoystickManager;

    private _movementIsActive = false;
    private _movementVector!: Vector2;
    private _lookIsActive = false;
    private _lookVector!: Vector2;

    awake(): void {
        this._lookVector = new Vector2();
        this._movementVector = new Vector2();
    }

    onEnable(): void {
        if (isMobileDevice()) {
            const dynamicContainer = document.createElement('div');
            dynamicContainer.style.cssText = `
                position: absolute;
                top: 0%;
                left: 0%;
                width: 100%;
                height: 100%;
            `
            const staticContainer = document.createElement('div');
            staticContainer.id = 'joystick';
            staticContainer.style.cssText = `
                position: absolute;
                top: 80%;
                left: 0%;
                width: 40%;
                height: 20%;
            `
            this.context.domElement.append(dynamicContainer);
            this.context.domElement.append(staticContainer);

            this._movement = nipplejs.create({
                mode: 'static',
                position: { left: '50%', top: '50%' },
                catchDistance: 1,
                zone: staticContainer,
            });
            this._movement.on('start', () => { this._movementIsActive = true; });
            this._movement.on('move', (_, data) => { this._movementVector.set(data.vector.x, data.vector.y).multiplyScalar(this.movementSensitivity); });
            this._movement.on('end', () => { this._movementIsActive = false; });


            this._look = nipplejs.create({
                mode: 'dynamic',
                catchDistance: 1,
                maxNumberOfNipples: 1,
                zone: dynamicContainer
            });
            this._look.on('start', () => { this._lookIsActive = true; });
            this._look.on('move', (_, data) => { this._lookVector.set(data.vector.x, data.vector.y * -1).multiplyScalar(this.lookSensitivity); });
            this._look.on('end', () => { this._lookIsActive = false; });
        }
    }
    onDisable(): void {
        this._movement?.destroy();
        this._look?.destroy();
    }

    update() {
        if (this._movementIsActive) {
            this.controller?.move(this._movementVector);
        }

        if (this._lookIsActive) {
            this.controller?.look(this._lookVector);
        }
    }
}