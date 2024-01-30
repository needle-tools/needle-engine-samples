// START MARKER Emit Particles On Click
import { setWorldPosition, Behaviour, GameObject, Gizmos, ParticleSystem, getParam, serializeable, NeedleXREventArgs } from "@needle-tools/engine";
import { Vector3 } from "three";

const debug = getParam("sample_debugParticlesOnClick");

export class EmitParticlesOnClick extends Behaviour {

    @serializeable(ParticleSystem)
    particleSystems: ParticleSystem[] = [];

    update(): void {
        if(!this.context.isInVR && this.context.input.getPointerClicked(0)) {
            const hits = this.context.physics.raycast();
            if(hits.length > 0) {
                this.spawnParticlesAt(hits[0].point);
            }
        }  
    }
    onUpdateXR(args: NeedleXREventArgs) {
        args.xr.controllers.forEach((controller) => {
            if (controller.getButton("primary")?.isDown === true) {
                const hit = this.context.physics.raycastFromRay(controller.ray)?.at(0);
                if(hit) {
                    this.spawnParticlesAt(hit.point);   
                }
            }
        });
    }

    spawnParticlesAt(pos: Vector3) {
        setWorldPosition(this.gameObject, pos);
        if(debug)
            Gizmos.DrawWireSphere(pos, 0.5, 0xff0000, 1);
        for (const ps of this.particleSystems) {
            if(!ps) continue;
            GameObject.setActive(ps.gameObject, true);
            ps.play();
        }
    }
}
// END MARKER Emit Particles On Click