import { Behaviour, EventList, RGBAColor, isMobileDevice, serializable } from "@needle-tools/engine";
import nipplejs from "nipplejs";
import { Vector2, Color } from "three";

export class MobileControls extends Behaviour {

    onlyMobile: boolean = true;
    movementSensitivity: number = 1;
    lookSensitivity: number = 5;
    maxDoubleTapDelay: number = 200;

    // @type UnityEngine.Color
    @serializable(RGBAColor)
    moveJoyColor!: RGBAColor;

    // @type UnityEngine.Color
    @serializable(RGBAColor)
    lookJoyColor!: RGBAColor;

    // @nonSerialized
    @serializable(EventList)
    onJump: EventList = new EventList();

    // @nonSerialized
    @serializable(EventList)
    onMove: EventList = new EventList();

    // @nonSerialized
    @serializable(EventList)
    onLook: EventList = new EventList();

    // See https://github.com/yoannmoinet/nipplejs for all options
    protected _movement?: nipplejs.JoystickManager;
    protected _look?: nipplejs.JoystickManager;

    protected _movementIsActive = false;
    protected _movementVector!: Vector2;
    protected _lookIsActive = false;
    protected _lookVector!: Vector2;

    protected _htmlElements: HTMLElement[] = [];

    awake(): void {
        this._lookVector = new Vector2();
        this._movementVector = new Vector2();
    }

    onEnable() {
        // Onle enable touch controls on mobile
        if (!isMobileDevice() && this.onlyMobile) return;

        const dynamicContainer = document.createElement('div');
        dynamicContainer.id = 'look-joystick';
        dynamicContainer.style.cssText = `
                position: absolute;
                top: 0%;
                left: 0%;
                width: 100%;
                height: 100%;
                user-select: none;
                -webkit-user-select: none;
                -webkit-touch-callout: none;
            `
        const staticContainer = document.createElement('div');
        staticContainer.id = 'movement-joystick';
        staticContainer.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                width:  200px;
                height: 200px;
                user-select: none;
                -webkit-user-select: none;
                -webkit-touch-callout: none;
            `
        this.context.domElement.append(dynamicContainer);
        this.context.domElement.append(staticContainer);
        this._htmlElements.push(dynamicContainer);
        this._htmlElements.push(staticContainer);

        const pixelThreshold = 10;
        this._movement = nipplejs.create({
            mode: 'static',
            position: { left: '50%', top: '50%' },
            catchDistance: 1000,
            zone: staticContainer,
            size: 130,
            color: this.getRGBAColorString(this.moveJoyColor),
            fadeTime: 0,
        });
        this._movement.on('start', () => { this._movementIsActive = true; });
        this._movement.on('move', (_, data) => {
            if (data.distance > pixelThreshold)
                this._movementVector.set(data.vector.x, data.vector.y).multiplyScalar(this.movementSensitivity);
            else this._movementVector.set(0, 0);
        });
        this._movement.on('end', () => { this._movementIsActive = false; });


        const fullRotationSpeedDistance = 130 / 2;
        this._look = nipplejs.create({
            mode: 'dynamic',
            catchDistance: 1000,
            maxNumberOfNipples: 1,
            zone: dynamicContainer,
            size: 130,
            color: this.getRGBAColorString(this.lookJoyColor),
            fadeTime: 0,
        });
        this._look.on('start', () => { this._lookIsActive = true; });
        this._look.on('move', (_, data) => {
            if (data.distance > pixelThreshold)
                this._lookVector.set(data.vector.x, data.vector.y * -1).multiplyScalar(this.lookSensitivity * data.distance / fullRotationSpeedDistance);
            else this._lookVector.set(0, 0);
        });
        let lastLookEndTime: number = 0;
        this._look.on('end', () => {
            this._lookIsActive = false;
            // double tap to jump:
            const now = Date.now();
            if (now - lastLookEndTime < this.maxDoubleTapDelay) {
                this.onJump?.invoke();
            }
            lastLookEndTime = now;
        });

    }

    onDisable(): void {
        this._movement?.destroy();
        this._look?.destroy();
        for (const html of this._htmlElements)
            html.remove();
        this._htmlElements.length = 0;
    }

    update() {
        if (this._movementIsActive) {
            this.onMove?.invoke(this._movementVector);
        }

        if (this._lookIsActive) {
            this.onLook?.invoke(this._lookVector);
        }

    }

    getRGBAColorString(color: RGBAColor): string {
        return `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;
    }
}