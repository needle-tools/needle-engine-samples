import { Behaviour, serializable } from "@needle-tools/engine";
import { Vector3, MathUtils } from "three";

export class Lift extends Behaviour {
    @serializable()
    speed: number = 1;

    @serializable()
    cycleOffset: number = 0;

    @serializable(Vector3)
    offset: Vector3 = new Vector3(0, 1, 0);

    private startPos: Vector3 = new Vector3();
    private endPos: Vector3 = new Vector3();
    awake(): void {
        this.startPos.copy(this.gameObject.position);
        this.endPos.copy(this.startPos);
        this.endPos.add(this.offset);
    }

    private tempVec: Vector3 = new Vector3();
    update(): void {
        const time = this.context.time.time;

        const t = (Math.sin((time * this.speed) + this.cycleOffset) + 1) / 2;
        this.tempVec.copy(this.startPos);
        this.tempVec.lerp(this.endPos, MathUtils.smoothstep(t, 0, 1));

        this.gameObject.position.copy(this.tempVec);
    }
}