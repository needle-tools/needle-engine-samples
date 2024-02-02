import { Behaviour, ParticleSystem, serializable } from "@needle-tools/engine";



export class BowArrowTarget extends Behaviour {

    @serializable(ParticleSystem)
    particleSystem?: ParticleSystem;


    onDestroy(): void {
        if (this.particleSystem) {
            this.particleSystem.worldPosition = this.gameObject.worldPosition;
            this.particleSystem.play()
        }
    }

}