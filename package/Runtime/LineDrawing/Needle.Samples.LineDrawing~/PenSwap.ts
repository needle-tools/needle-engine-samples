import { Animator, Behaviour, GameObject, Gizmos, IGameObject, serializable } from "@needle-tools/engine";
import { Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

export class PenSwap extends Behaviour {

    @serializable(Animator)
    animator: Array<Animator>;

    @serializable(GameObject)
    enabledForPen: Array<GameObject>;

    @serializable(GameObject)
    enabledForSword: Array<GameObject>;

    @serializable(Behaviour)
    enabledForPen2: Array<Behaviour>;

    @serializable(Behaviour)
    enabledForSword2: Array<Behaviour>;

    private _fwd: Vector3 = new Vector3(0, 1, 0);
    private isTransformed: boolean = false;

    update(): void {
        // check rotation between GameObject and world up
        const fwd = this.gameObject.worldForward;
        // TODO should be rig space forward
        const dot = fwd.dot(this._fwd);
        const angle = Math.acos(dot) * (180 / Math.PI);

        if (angle > 130 && !this.isTransformed) {
            this.isTransformed = true;
            for (const anim of this.animator)
                anim.setBool("transform", true);
            for (const obj of this.enabledForPen)
                GameObject.setActive(obj, false);
            for (const obj of this.enabledForSword)
                GameObject.setActive(obj, true);
            for (const obj of this.enabledForPen2)
                obj.enabled = false;
            for (const obj of this.enabledForSword2)
                obj.enabled = true;
        }
        else if (angle < 75 && this.isTransformed) {
            this.isTransformed = false;
            for (const anim of this.animator)
                anim.setBool("transform", false);
            for (const obj of this.enabledForPen)
                GameObject.setActive(obj, true);
            for (const obj of this.enabledForSword)
                GameObject.setActive(obj, false);
            for (const obj of this.enabledForPen2)
                obj.enabled = true;
            for (const obj of this.enabledForSword2)
                obj.enabled = false
        }
    }
}
