import { Behaviour, MeshRenderer, ParticleSystem, isDestroyed, serializable } from "@needle-tools/engine";
import { ParticleSystemShapeType } from "@needle-tools/engine";


export class BowArrowTarget extends Behaviour {

    @serializable(ParticleSystem)
    particleSystem?: ParticleSystem;

    private _meshRenderer?: MeshRenderer;

    start() {
        this._meshRenderer = this.gameObject.getComponentInChildren(MeshRenderer) as MeshRenderer;
        // setTimeout(()=>{
        //     this.gameObject.destroy();
        // }, 1000)
    }

    onDestroy(): void {
        if (this.particleSystem) {
            // if the particlesystem is set to use a mesh renderer as shape
            if (this.particleSystem.shape.shapeType === ParticleSystemShapeType.MeshRenderer) {
                // this requires a change in Needle Engine (so it works only on a dev branch)
                if (this._meshRenderer && !isDestroyed(this._meshRenderer.gameObject)) {
                    this.particleSystem.shape.shapeType = ParticleSystemShapeType.MeshRenderer;
                    this.particleSystem.shape.setMesh(this._meshRenderer);
                    this.particleSystem.play();
                    return;
                }
            }

            this.particleSystem.shape.shapeType = ParticleSystemShapeType.Sphere;
            this.particleSystem.worldPosition = this.gameObject.worldPosition;
            this.particleSystem.play()
        }
    }

}
