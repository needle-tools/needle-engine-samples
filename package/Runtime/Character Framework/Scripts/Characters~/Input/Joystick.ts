import { Behaviour, EventList, RGBAColor, serializable } from "@needle-tools/engine";

import { Vector2 } from "three";

import nipplejs from "nipplejs";

// TODO: add RectTransform as optional Ref to drive alignment
/** Wrapper and creator for a single static nipple.js joystick */
export class Joystick extends Behaviour {
    movementSensitivity: number = 1;
    lookSensitivity: number = 5;
    maxDoubleTapDelay: number = 200;

    // @nonSerialized
    @serializable(RGBAColor)
    color: RGBAColor = new RGBAColor(1, 1, 1, 0.5);

    @serializable()
    size: number = 120;

    // @nonSerialized
    onValueChange!: EventList;
    // @nonSerialized
    onStart!: EventList;
    // @nonSerialized
    onEnd!: EventList;

    // @nonSerialized
    @serializable()
    containerCss: string = `position: absolute;
bottom: 0;
left: 0;
width:  200px;
height: 200px;
user-select: none;
-webkit-user-select: none;
-webkit-touch-callout: none;`;

    // See https://github.com/yoannmoinet/nipplejs for all options
    protected _movement?: nipplejs.JoystickManager;
    protected _look?: nipplejs.JoystickManager;

    protected _isActive = false;
    protected _delta!: Vector2;
    protected _cumulativeDelta!: Vector2;

    protected _htmlElements: HTMLElement[] = [];

    constructor() {
        super();

        this._delta = new Vector2();
        this._cumulativeDelta = new Vector2();
        this.onValueChange = new EventList();
        this.onStart = new EventList();
        this.onEnd = new EventList();
    }

    onEnable() {
        const staticContainer = document.createElement('div');
        staticContainer.id = 'movement-joystick';
        staticContainer.style.cssText = this.containerCss;

        this.context.domElement.append(staticContainer);
        this._htmlElements.push(staticContainer);

        const pixelThreshold = 10;
        this._movement = nipplejs.create({
            mode: 'static',
            position: { left: '50%', top: '50%' },
            catchDistance: 1000,
            zone: staticContainer,
            size: this.size,
            color: this.getRGBAColorString(this.color),
            fadeTime: 0,
        });
        this._movement.on('start', () => {
            this._isActive = true;
            this._cumulativeDelta.set(0, 0);
            this.onStart?.invoke();
        });
        this._movement.on('move', (_, data) => {
            this._cumulativeDelta.x += data.vector.x;
            this._cumulativeDelta.x += data.vector.y;
            if (data.distance > pixelThreshold)
                this._delta.set(data.vector.x, data.vector.y).multiplyScalar(this.movementSensitivity);
            else this._delta.set(0, 0);
        });
        this._movement.on('end', () => {
            this._isActive = false;
            this._delta.set(0, 0);
            this.onValueChange?.invoke(this._delta, this._cumulativeDelta);
            this.onEnd?.invoke();
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
        if (this._isActive) {
            this.onValueChange.invoke(this._delta, this._cumulativeDelta);
        }
    }

    private getRGBAColorString(color: RGBAColor): string {
        return `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;
    }
}