import { Behaviour, GameObject, serializable } from "@needle-tools/engine";
import { OrbitControlsView } from "./OrbitControlsView";
import { getWorldPosition } from "@needle-tools/engine/src/engine/engine_three_utils";
import { Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

export class SpatialAudioUI extends Behaviour {

    @serializable(OrbitControlsView)
    centerPoints: OrbitControlsView[] = [];

    private template() {
        return /*html*/`
            <div class="spatial-audio-ui">
                <button class="left">‹</button>
                <p class="name">Instrument</p>
                <span>Swipe or tap to change</span>
                <button class="right">›</button>
            </div>
        `;
    }

    private style() {
        return /*css*/`
            .spatial-audio-ui {
                position: absolute;
                top: 50px;
                left: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transform: translateX(-50%);
                vertical-align: middle;
            }

            .spatial-audio-ui button {
                outline: none;
                border: none;
                background: none;
                font-size: 4rem;
                color: white;
                transition: transform 0.2s;
            }

            .spatial-audio-ui button:hover {
                cursor: pointer;
                transform: scale(1.4);
            }

            .spatial-audio-ui span {
                position: absolute;
                font-size: 1rem;
                color: white;
                opacity: 0.3;
                left: 65px;
                top: 0px;
                text-align: center;
            }

            .spatial-audio-ui p {
                font-size: 2rem;
                color: white;
                margin: 0 1rem;
                margin-top: 0.6rem;
                text-transform: uppercase;
                width: 200px;
                text-align: center;
            }
        `;
    }
    
    private element: HTMLElement;
    private styleElement: HTMLStyleElement;

    onEnable() {
        const template = document.createElement('template');
        template.innerHTML = this.template();
        this.element = template.content.firstElementChild?.cloneNode(true) as HTMLElement;

        this.styleElement = document.createElement('style');
        this.styleElement.innerHTML = this.style();

        this.context.domElement.appendChild(this.element);
        this.context.domElement.appendChild(this.styleElement);

        this.element.querySelector('.left')?.addEventListener('click', () => {
            this.changeIndex(-1);
        });

        this.element.querySelector('.right')?.addEventListener('click', () => {
            this.changeIndex(1);
        });

        this.element.querySelector('.name')?.addEventListener('click', () => {
            this.changeIndex(1);
        });

        // detect swipe gesture to swipe next/previous
        this._touchstart = this.touchstart.bind(this);
        this.context.domElement.addEventListener('pointerdown', this._touchstart);
        this._touchend = this.touchend.bind(this);
        this.context.domElement.addEventListener('pointerup', this._touchend);
    }

    private changeIndex(change: -1 | 1) {
        let index = this.centerPoints.indexOf(this.currentCenterPoint!);
        index += change;
        if (index >= this.centerPoints.length)
            index = 0;
        if (index < 0)
            index = this.centerPoints.length - 1;
        this.centerPoints[index].setView();
    }

    onDisable() {
        this.element.remove();
        this.styleElement.remove();
        this.context.domElement.removeEventListener('pointerdown', this._touchstart);
        this.context.domElement.removeEventListener('pointerup', this._touchend);
    }

    private camPos = new Vector3();
    private currentCenterPoint: OrbitControlsView | null = null;

    update() {
        const cam = this.context.mainCamera;
        getWorldPosition(cam, this.camPos);

        let closest: OrbitControlsView | null = null;
        let closestDistance = Infinity;
        for (const centerPoint of this.centerPoints) {
            const centerPointPos = getWorldPosition(centerPoint.gameObject);
            const distance = centerPointPos.distanceTo(this.camPos);
            if (distance < closestDistance) {
                closest = centerPoint;
                closestDistance = distance;
            }
        }

        if (closest !== this.currentCenterPoint && closest) {
            this.currentCenterPoint = closest;
            this.element.querySelector('.name')!.textContent = closest.gameObject.parent.name;
        }
    }

    private startX = 0;
    private startTime = 0;
    private _touchstart;
    private _touchend;

    private touchstart(e) {
        this.startX = e.clientX;
        this.startTime = Date.now();
    }

    private touchend(e) {
        const endX = e.clientX;
        const diff = endX - this.startX;
        const timeDiff = Date.now() - this.startTime;
        if (timeDiff < 250 
            && Math.abs(diff) > 20 
            // || Math.abs(diff) > this.context.domWidth / 2
        ){
            if (diff > 0) {
                this.changeIndex(-1);
            } else {
                this.changeIndex(1);
            }
        }
    }
}