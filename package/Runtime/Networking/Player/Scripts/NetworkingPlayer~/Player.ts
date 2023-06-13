import { Behaviour } from "@needle-tools/engine";

export class Player extends Behaviour {
    
    speed: number = 5;

    update(): void {
        const input = this.context.input;
        const dt = this.context.time.deltaTime;

        if (input.isKeyPressed("ArrowLeft")) {
            this.gameObject.position.x -= this.speed * dt;
        }
        if (input.isKeyPressed("ArrowRight")) {
            this.gameObject.position.x += this.speed * dt;
        }
        if (input.isKeyPressed("ArrowUp")) {
            this.gameObject.position.z -= this.speed * dt;
        }
        if (input.isKeyPressed("ArrowDown")) {
            this.gameObject.position.z += this.speed * dt;
        }
    }
}