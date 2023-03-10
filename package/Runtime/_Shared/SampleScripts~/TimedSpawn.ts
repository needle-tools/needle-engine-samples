import { Behaviour, GameObject, LogType, serializeable, showBalloonMessage } from "@needle-tools/engine";
import { WaitForSeconds } from "@needle-tools/engine/src/engine/engine_coroutine";
import { serializeObject } from "@needle-tools/engine/src/engine/engine_serialization_core";
import { Object3D } from "three";

export class TimedSpawn extends Behaviour {
    @serializeable(GameObject)
    object?: GameObject;

    interval: number = 1000;
    max: number = 100;

    private spawned: number = 0;

    awake() {
        if (!this.object) {
            console.warn("TimedSpawn: no object to spawn");
            showBalloonMessage("TimedSpawn: no object to spawn", LogType.Warn);
            return;
        }
        GameObject.setActive(this.object, false);
        this.startCoroutine(this.spawn())
    }

    *spawn() {
        if (!this.object) return;
        while (this.spawned < this.max) {
            const instance = GameObject.instantiate(this.object);
            GameObject.setActive(instance!, true);
            this.spawned += 1;
            yield WaitForSeconds(this.interval / 1000);
        }
    }
}
