import { Behaviour, GameObject, Gizmos, ParticleSystem, serializeable, showBalloonMessage, showBalloonWarning } from "@needle-tools/engine";
import { InputEvents } from "@needle-tools/engine/engine/engine_input";
import { setWorldPosition } from "@needle-tools/engine/engine/engine_three_utils";

export class EmitParticlesOnClick extends Behaviour {

    @serializeable(ParticleSystem)
    particleSystems: ParticleSystem[] = [];

    awake() {
        this.context.input.addEventListener(InputEvents.PointerUp, evt => {
            // TODO: make work for XR
            const hits = this.context.physics.raycast();
            if (hits.length) {
                const hit = hits[0];
                setWorldPosition(this.gameObject, hit.point);
                Gizmos.DrawWireSphere(hit.point, 0.5, 0xff0000, 1);
                for (const ps of this.particleSystems) {
                    GameObject.setActive(ps.gameObject, true);
                    ps.play();
                }
            }
            else if(this.context.isInAR) showBalloonWarning("Nothing hit: " + JSON.stringify(evt));
        });
    }
}