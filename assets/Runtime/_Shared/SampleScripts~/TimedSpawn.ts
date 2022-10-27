import { Behaviour, GameObject, LogType, serializeable, showBalloonMessage } from "@needle-tools/engine";
import { serializeObject } from "@needle-tools/engine/engine/engine_serialization_core";
import { Object3D } from "three";

export class TimedSpawn extends Behaviour {
    @serializeable(GameObject)
    object?: GameObject;

    interval: number = 1000;
    max : number = 100;
    
    private spawned : number = 0;

    awake() {
        if (!this.object) {
            console.warn("TimedSpawn: no object to spawn");
            showBalloonMessage("TimedSpawn: no object to spawn", LogType.Warn);
            return;
        }
        GameObject.setActive(this.object, false);
        const interval = setInterval(() => {
            if (!this.object) return;
            if(this.spawned >= this.max) {
                clearInterval(interval);
                return;
            }
            const instance = GameObject.instantiate(this.object);
            GameObject.setActive(instance!, true);
            this.spawned += 1;
        }, this.interval);
    }
}