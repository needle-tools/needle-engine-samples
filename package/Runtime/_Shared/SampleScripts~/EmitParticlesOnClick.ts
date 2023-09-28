// START MARKER Emit Particles On Click
import { InputEvents, setWorldPosition, Behaviour, GameObject, Gizmos, ParticleSystem, getParam, serializeable, showBalloonMessage, showBalloonWarning, WebXR, getWorldPosition } from "@needle-tools/engine";
import { Vector3 } from "three";

const debug = getParam("sample_debugParticlesOnClick");

export class EmitParticlesOnClick extends Behaviour {

    @serializeable(ParticleSystem)
    particleSystems: ParticleSystem[] = [];

    private webXR?: WebXR;
    private tempVector: Vector3 = new Vector3();

    awake(): void {
        this.webXR = GameObject.findObjectOfType(WebXR)!;
    }

    update() {
        if(!this.context.isInVR && this.context.input.getPointerClicked(0)) {
            const hits = this.context.physics.raycast();
            if(hits.length > 0) {
                this.spawnParticlesAt(hits[0].point);
            }
        }
        else if(this.context.isInVR && this.webXR) {
            this.webXR.Controllers.forEach((controller) => {
                if (controller.selectionDown && controller.raycastHitPoint) {
                    getWorldPosition(controller.raycastHitPoint, this.tempVector);
                    this.spawnParticlesAt(this.tempVector);
                }
            })
        }
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