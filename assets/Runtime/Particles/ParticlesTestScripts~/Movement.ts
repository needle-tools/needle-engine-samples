import { Behaviour, serializeable } from "@needle-tools/engine";

export class Particle_MoveAround extends Behaviour {

    @serializeable()
    factor : number = 1;

    update() {
        this.gameObject.position.y += Math.sin(this.context.time.time) * this.context.time.deltaTime * this.factor;
    }

}