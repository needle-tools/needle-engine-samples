import { Behaviour, SkinnedMeshRenderer, serializable } from "@needle-tools/engine";

export class BlendShapeProxy extends Behaviour {

    @serializable(SkinnedMeshRenderer)
    renderer?: SkinnedMeshRenderer;

    @serializable()
    blendShapeIndex: number = 0;

    setBlendShapeWeight(weight: number) {
        const mesh = this.renderer?.sharedMesh;
        if (mesh && "morphTargetInfluences" in mesh && mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[this.blendShapeIndex] = weight;
        }
    }
}
