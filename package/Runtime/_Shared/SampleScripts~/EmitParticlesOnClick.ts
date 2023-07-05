// START MARKER Emit Particles On Click
import { InputEvents, setWorldPosition, Behaviour, GameObject, Gizmos, ParticleSystem, getParam, serializeable, showBalloonMessage, showBalloonWarning } from "@needle-tools/engine";

const debug = getParam("sample_debugParticlesOnClick");

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
                if(debug)
                    Gizmos.DrawWireSphere(hit.point, 0.5, 0xff0000, 1);
                for (const ps of this.particleSystems) {
                    if(!ps) continue;
                    GameObject.setActive(ps.gameObject, true);
                    ps.play();
                }
            }
            else if(this.context.isInAR) showBalloonWarning("Nothing hit: " + JSON.stringify(evt));
        });
    }
}
// END MARKER Emit Particles On Click