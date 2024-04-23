import { Behaviour, Collider, GameObject, ICollider, serializable } from '@needle-tools/engine';
import { Object3D, Vector3 } from 'three';

const up = new Vector3(0, 0, 1);

export class MinigolfPaddle extends Behaviour {

    @serializable(Object3D)
    target?: GameObject;

    private _cols: ICollider[] = [];

    awake(): void {
        this._cols = this.gameObject.getComponentsInChildren(Collider);
    }

    onBeforeRender(_frame: XRFrame | null): void {
        if (this.target) {
            const forward = this.target.worldForward;
            // const dot = forward.dot(up);
            // console.log(dot);
            // if (dot < -.2) 
            {
                const wp = this.target.worldPosition;

                const hit = this.context.physics.engine?.raycast(wp, forward, {
                    maxDistance: 1.2,
                    filterPredicate: (col) => !this._cols.includes(col)
                });
                if (hit) {
                    const dist = hit.point.distanceTo(wp) - .15;
                    if (dist > .2)
                        this.target.scale.z = dist;
                }
            }
        }
    }
}