import { Behaviour, Collision, Gizmos, ParticleSystem, serializable, showBalloonMessage } from "@needle-tools/engine";
import { setWorldPosition } from "@needle-tools/engine/src/engine/engine_three_utils";
import { getParam } from "@needle-tools/engine";
import { Vector3, Color } from "three";

const debug = getParam("debugparticles");

export class ParticleOnCollision extends Behaviour {
    @serializable(ParticleSystem)
    particles?: ParticleSystem;

    @serializable(Color)
    color1: Color;

    @serializable(Color)
    color2: Color;

    @serializable()
    slowmoOnCollision: boolean = false;

    onCollisionEnter(col: Collision) {
        if (this.particles) {
            const normal = col.contacts[0].normal.multiplyScalar(-1);
            setWorldPosition(this.particles.gameObject, col.contacts[0].point.add(normal.clone().multiplyScalar(0.05)))
            this.particles.gameObject.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), normal);
            this.particles.main.startColor.colorMin = this.color1;
            this.particles.main.startColor.colorMax = this.color2;
            this.particles.emit(200);
            // setTimeout(() => this.context.isPaused = true, 10)
            if (debug || this.slowmoOnCollision) {
                Gizmos.DrawDirection(col.contacts[0].point, normal, this.color1, 2, false);
                this.context.time.timeScale = 0.05;
                setTimeout(() => this.context.time.timeScale = 1, 1000)
            }
        }
    }
}
