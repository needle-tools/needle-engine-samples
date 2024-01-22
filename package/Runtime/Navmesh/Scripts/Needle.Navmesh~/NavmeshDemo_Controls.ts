import { Behaviour, Gizmos, NEKeyboardEvent } from "@needle-tools/engine";
import { Vector3, Object3D } from "three";
import { Navmesh } from "./Navmesh";

export class NavmeshDemo_Controls extends Behaviour {

    private path?: Vector3[];
    update(): void {
        if (this.context.input.getPointerClicked(0)) {
            if (this.targetCount == 2) {
                this.targetCount = 0;
                this.needsPath = false;
                this.path = undefined;
            }

            this.raycast();
        }

        if (this.needsPath) {
            this.path = Navmesh.FindPath(this.from, this.to);
            this.needsPath = false;
        }

        if (this.path) {
            for (let i = 0; i < this.path.length - 1; i++) {
                const a = this.path[i];
                const b = this.path[i + 1];
                Gizmos.DrawLine(a, b, 0xff0000, 0, false);
                Gizmos.DrawSphere(a, 0.1, 0xff0000, 0, false);
            }
            // get last element from path array
            const lastNode = this.path[this.path.length - 1];
            Gizmos.DrawSphere(lastNode, 0.1, 0xff0000, 0, false);
        }
        else if (this.targetCount != -1){
            Gizmos.DrawSphere(this.from, 0.1, 0xff0000, 0, false);
        }
    }

    private needsPath = false;
    private from: Vector3 = new Vector3();
    private to: Vector3 = new Vector3();
    private targetCount = -1;
    raycast() {
        const hits = this.context.physics.raycast(); //raycast from the mouse curosr pos
        const firstHit = hits.filter(x => x.object instanceof Object3D)[0];
        if (firstHit) {
            if(this.targetCount == -1)
                this.targetCount = 0;
             
            this.targetCount++;
            if (this.targetCount == 1) {
                this.from.copy(firstHit.point);
            }
            else if (this.targetCount == 2) {
                this.to.copy(firstHit.point);
                this.needsPath = true;
            }
        }
    }
}