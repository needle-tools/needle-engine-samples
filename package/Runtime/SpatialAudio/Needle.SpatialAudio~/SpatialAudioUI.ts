import { Behaviour, GameObject, OrbitControls, serializable } from "@needle-tools/engine";
import { OrbitControlsView } from "./OrbitControlsView";
import { getWorldPosition } from "@needle-tools/engine/src/engine/engine_three_utils";
import { Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

export class SpatialAudioUI extends Behaviour {

    @serializable(OrbitControlsView)
    centerPoints: OrbitControlsView[] = [];

    @serializable(OrbitControls)
    orbitControls?: OrbitControls;

    private template() {
        return /*html*/`
            <div>
                <div class="spatial-audio-ui">
                    <button class="left">‹</button>
                    <p class="name">Instrument</p>
                    <span>Swipe or tap to change</span>
                    <button class="right">›</button>
                </div>

                <div class="explainer">
                    <div>
                        <h1 class="ignore-landscape">Spatial Audio</h1>
                        <p>Sound on! 🔊</p>
                        <p>This sample demonstrates how to use spatial audio in <a href="https://needle.tools">Needle Engine</a>. Audio sources can be placed in 3D, and your camera position influences how loud they are.</p>
                        <p>You can move around the scene in the browser, open the page on your phone and try it in Augmented Reality, or in Virtual Reality on a VR headset.</p>
                        <button class="start">Start exploring</button><br class="ignore-landscape"/>
                        <a class="start-quest button small" target="_blank">Open on Quest</a>
                    </div>
                </div>
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
                min-width: 100%; /* to avoid text wrapping */
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
                top: 0px;
                text-align: center;
            }

            .spatial-audio-ui p {
                font-size: 2rem;
                color: white;
                margin: 0 1rem;
                margin-top: 0.6rem;
                text-transform: uppercase;
                text-align: center;
                position: relative;
            }

            .explainer {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                text-align: center;
                color: white;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .explainer h1 {
                text-transform: uppercase;
                font-weight: 400;
            }

            .explainer > div {
                max-width: min(94vw, 500px);
            }

            .explainer a {
                color: #b9f026;
                text-decoration: none;
                white-space: nowrap;
            }

            .explainer button, .explainer a.button {
                background: white;
                color: black;
                border: none;
                padding: 1rem 2rem;
                font-size: 1rem;
                outline: none;
                transition: transform 0.2s;
                border-radius: 0.5rem;
                margin: 2rem;
            }

            .explainer button.small, .explainer a.button.small {
                padding: 0.5rem 2rem;
                background: #ccc;
            }

            .explainer button:hover, .explainer a.button:hover {
                cursor: pointer;
                transform: scale(1.1);
            }

            @media (max-height: 450px) {
                .ignore-landscape {
                    display: none;
                }
            }

            span {
                text-overflow: ;
            }
        `;
    }
    
    private element?: HTMLElement;
    private styleElement?: HTMLStyleElement;

    onEnable() {
        const template = document.createElement('template');
        template.innerHTML = this.template();
        this.element = template.content.firstElementChild?.cloneNode(true) as HTMLElement;

        this.styleElement = document.createElement('style');
        this.styleElement.innerHTML = this.style();

        this.context.appendHTMLElement(this.element);
        this.context.appendHTMLElement(this.styleElement);

        // add event listeners to buttons and also to the text to make it easier to click
        this.element.querySelector('.left')?.addEventListener('click', () => { this.changeIndex(-1); });
        this.element.querySelector('.right')?.addEventListener('click', () => { this.changeIndex(1); });
        this.element.querySelector('.name')?.addEventListener('click', () => { this.changeIndex(1); });

        // hide the explainer when the user clicks the start button
        this.element.querySelector('.start')?.addEventListener('click', () => {
            this.element?.querySelector('.explainer')?.remove();
        });

        // open the page on the quest when the user clicks the button
        const questLink = this.element.querySelector('.start-quest') as HTMLAnchorElement;
        const url = new URL(window.location.href);
        questLink.href = `https://www.oculus.com/open_url/?url=${encodeURIComponent(url.toString())}`;
        
        // detect swipe gesture to swipe next/previous
        this._touchstart = this.touchstart.bind(this);
        this.context.domElement.addEventListener('pointerdown', this._touchstart);
        this._touchend = this.touchend.bind(this);
        this.context.domElement.addEventListener('pointerup', this._touchend);

        // arrow keys work too
        this._keydown = this.keydown.bind(this);
        document.addEventListener('keydown', this._keydown);
    }

    // find the current center point and change to the next one
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
        this.element?.remove();
        this.styleElement?.remove();
        this.context.domElement.removeEventListener('pointerdown', this._touchstart);
        this.context.domElement.removeEventListener('pointerup', this._touchend);
    }

    private camPos = new Vector3();
    private currentCenterPoint: OrbitControlsView | null = null;

    // find the closest center point to the camera and update the UI
    update() {

        // get orbit origin of the camera instead of its position
        if(this.orbitControls && this.orbitControls.controls)
            this.camPos = this.orbitControls.controls.target;

        /* const cam = this.context.mainCamera; */
        /* getWorldPosition(pos, this.camPos); */

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
            if(this.element && closest.gameObject.parent)
                this.element.querySelector('.name')!.textContent = closest.gameObject.parent.name;
        }
    }

    // helpers for swipe and keyboard events

    private startX = 0;
    private startTime = 0;
    private _touchstart;
    private _touchend;
    private _keydown;

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

    private keydown(e) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            this.changeIndex(-1);
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            this.changeIndex(1);
        }
    }
}