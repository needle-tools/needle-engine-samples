import { Behaviour, GameObject, Gizmos, NEKeyboardEvent, findObjectsOfType, serializable } from "@needle-tools/engine";
import { Vector3, Object3D } from "three";
import { Navmesh } from "./Navmesh";
import { NavmeshDemo_Agent } from "./NavmeshDemo_Agent";

export class NavmeshDemo_Controls extends Behaviour {
    private goalPos?: Vector3;
    private agents: NavmeshDemo_Agent[] = [];

    @serializable(GameObject)
    goalVisualizer?: GameObject;

    awake(): void {
        findObjectsOfType(NavmeshDemo_Agent, this.agents, this.context);

        if (this.goalVisualizer)
            this.goalVisualizer.visible = false;
    }

    update(): void {
        if (this.context.input.getPointerClicked(0)) {
            this.raycast();
        }
    }

    raycast() {
        const hits = this.context.physics.raycast(); //raycast from the mouse curosr pos
        const firstHit = hits.filter(x => x.object instanceof Object3D)[0];
        if (firstHit) {
            this.goalPos = firstHit.point;

            if(this.goalVisualizer) {
                this.goalVisualizer.visible = true;
                this.goalVisualizer.worldPosition = this.goalPos;
            }
            
            let unitsMoving = 0;
            this.agents.forEach(agent => {
                if (!agent) return;

                unitsMoving++;
                agent.moveTo(this.goalPos!, async () => {
                    unitsMoving--;
                    if (unitsMoving === 0 && this.goalVisualizer) {
                        this.goalVisualizer.visible = false;
                    }
                });
            })
        }
    }
}