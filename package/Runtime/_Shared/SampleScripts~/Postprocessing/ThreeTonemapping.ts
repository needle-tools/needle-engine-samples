import { Behaviour, Mathf, getParam, serializable, showBalloonMessage } from "@needle-tools/engine";
import * as THREE from "three";

const debug = getParam("debugtonemapping");

export enum ThreeTonemappingMethod {
    NoToneMapping =          0,
    LinearToneMapping =      1,
    ReinhardToneMapping =    2,
    CineonToneMapping =      3,
    ACESFilmicToneMapping =  4,
    CustomToneMapping =      5,
    AgXToneMapping =         6,
    NeutralToneMapping =     7
}

export class ThreeTonemapping extends Behaviour {
    @serializable()
    method: ThreeTonemappingMethod = ThreeTonemappingMethod.NeutralToneMapping;

    @serializable()
    exposure: number = 1;

    awake(): void {
        this.toggle();
    }

    update(): void {
        if (!debug) return;
        const input = this.context.input;

        if (input.isKeyDown("f")) {
            this.toggle();
        }
        if (input.isKeyDown("g")) {
            this.method = Mathf.clamp(--this.method, 0, 7);
            this.set(this.method as THREE.ToneMapping, this.exposure);
        }
        if (input.isKeyDown("h")) {
            this.method = Mathf.clamp(++this.method, 0, 7);
            this.set(this.method as THREE.ToneMapping, this.exposure);
        }

        if (input.isKeyDown("j")) {
            this.exposure = Mathf.clamp(this.exposure - 0.1, 0, 5);
            this.set(this.method as THREE.ToneMapping, this.exposure);
        }
        if (input.isKeyDown("k")) {
            this.exposure = Mathf.clamp(this.exposure + 0.1, 0, 5);
            this.set(this.method as THREE.ToneMapping, this.exposure);
        }
    }

    private prevToneMapping?: ThreeTonemappingMethod;
    private prevExposure?: number;
    private state: boolean = false;
    toggle() {
        this.state  = !this.state;

        if (this.state) {
            if (debug) console.log()
            this.prevToneMapping = this.context.renderer.toneMapping;
            this.prevExposure = this.context.renderer.toneMappingExposure;

            this.set(this.method, this.exposure);
        }
        else {
            this.context.renderer.toneMapping = this.prevToneMapping ?? 0;
            this.context.renderer.toneMappingExposure = this.prevExposure ?? 1;
        }        
    }

    set(method: ThreeTonemappingMethod | number, exposure: number) {
        this.context.renderer.toneMapping = method as THREE.ToneMapping;
        this.context.renderer.toneMappingExposure = exposure;
        if (debug) {
            showBalloonMessage(`Tonemapping | Method: ${ThreeTonemappingMethod[this.context.renderer.toneMapping]} | Exposure: ${this.context.renderer.toneMappingExposure.toFixed(1)}`);
        }
    }
}