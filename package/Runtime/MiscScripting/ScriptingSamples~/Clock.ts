import { Behaviour } from "@needle-tools/engine";
import { serializeable } from "@needle-tools/engine";
import * as THREE from "three";

export class Clock extends Behaviour {

    @serializeable(THREE.Object3D)
    public hourHand: THREE.Object3D | null = null;
    @serializeable(THREE.Object3D)
    public minuteHand: THREE.Object3D | null = null;
    @serializeable(THREE.Object3D)
    public secondHand: THREE.Object3D | null = null;

    public speed : number = 1;

    private lastUpdate: number = -1000;
    private baseUtc : number = 0;

    awake() {
        let date = new Date();
        this.baseUtc = Date.UTC(
            date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 
            date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());

        // update once
        this.update();
    }

    update(): void {
        if (this.context.time.time - this.lastUpdate < 0.01) return;
        this.lastUpdate = this.context.time.time;
        let date = new Date();
        let now_utc = Date.UTC(
            date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 
            date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
        now_utc = (now_utc - this.baseUtc) * this.speed + this.baseUtc;
        date = new Date(now_utc);

        if (this.secondHand) {
            const seconds = date.getSeconds() - 15;
            this.secondHand.rotation.y = (0.5 + seconds / 60) * Math.PI * 2;
        }
        if (this.minuteHand) {
            const minutes = date.getMinutes();
            this.minuteHand.rotation.y = (0.5 + minutes / 60) * Math.PI * 2;
        }
        if (this.hourHand) {
            const hours = (date.getHours() + date.getMinutes() / 60);
            this.hourHand.rotation.y = (0.5 + hours / 12) * Math.PI * 2;
        }
    }

    setSpeed(speed : number) {
        this.speed = speed;
    }
}
