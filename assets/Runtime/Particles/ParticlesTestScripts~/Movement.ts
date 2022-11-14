import { Behaviour, serializable, serializeable } from "@needle-tools/engine";
import { Vector3, AxesHelper } from "three";

export class Particle_MoveAround extends Behaviour {

    @serializeable()
    factor : number = 1;

    update() {
        this.gameObject.position.y += Math.sin(this.context.time.time) * this.context.time.deltaTime * this.factor;
    }

}

export class Particle_Rotate extends Behaviour
{
    @serializable(Vector3)
    speed : Vector3 = new Vector3(1, 0, 0);

    update(){
        this.gameObject.rotateOnAxis(this.speed, this.context.time.deltaTime);
    }
}