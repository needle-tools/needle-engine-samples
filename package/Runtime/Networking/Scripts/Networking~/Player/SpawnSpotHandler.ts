import { Behaviour, GameObject, Gizmos, RaycastOptions, getParam, serializable, syncField } from "@needle-tools/engine";

import { Euler, Layers, Object3D, Ray, Vector3 } from "three";

const debug = getParam("debugspawnhandler")

export class SpawnSpotHandler extends Behaviour {
    @serializable(Object3D)
    spawnPoints: Object3D[] = [];

    @syncField()
    private validIndex: number = -1;

    @serializable()
    offsetForError: number = 1;

    private downVector = new Vector3(0, -1, 0);
    private upVector = new Vector3(0, 1, 0);
    private offsetVector = new Vector3();
    handlePlayerSpawn(obj: GameObject) {
        const options = new RaycastOptions();
        options.layerMask = new Layers();
        options.layerMask.enableAll();
        options.ray = new Ray(new Vector3(), this.downVector.clone());
        options.maxDistance = 2;

        // Choose a random spawn point that is not occupied
        let spot: Object3D | undefined;

        // increment the index
        if(this.validIndex + 1 >= this.spawnPoints.length)
            this.validIndex = 0;
        else
            this.validIndex++;

        for (let i = this.validIndex; i < this.spawnPoints.length; i++) {
            const element = this.spawnPoints[i];

            element.getWorldPosition(options.ray.origin);
            options.ray.origin.y += 3;

            options.ray.direction.copy(this.downVector);

            if (debug)
                Gizmos.DrawLine(options.ray.origin, options.ray.origin.clone().add(options.ray.direction.clone().multiplyScalar(options.maxDistance)), 0xff0000, 50, true);

            const result = this.context.physics.raycast(options);

            if (result.length == 0) {
                spot = element;
                this.validIndex = i;
                break;
            }
        }

        if(!spot) {
            console.log("No available spawn");
        }

        // If there is no valid spawn point, set world 0,0,0
        const pos = spot?.position.clone() || new Vector3();
        const rot = spot?.rotation.clone() || new Euler();

        // Offset the vector in case of invalid spawn
        this.offsetVector.set(0,0, this.offsetForError);
        this.offsetVector.applyAxisAngle(this.upVector, Math.random() * Math.PI * 2);
        pos.add(this.offsetVector);

        if (obj instanceof Object3D) {
            obj.worldToLocal(pos);

            obj.position.copy(pos);
            obj.rotation.copy(rot);
        }
    }
}