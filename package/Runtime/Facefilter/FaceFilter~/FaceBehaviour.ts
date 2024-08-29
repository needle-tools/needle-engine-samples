import { Animator, BehaviorExtension, Behaviour, serializable } from '@needle-tools/engine';
import type { Facefilter } from './FaceFilter.js';
import { Mesh, SkinnedMesh } from 'three';
import { BlendshapeName } from '@needle-tools/facefilter/utils.js';

/**
 * A base class for behaviours that interact with the face filter. Derive your custom behaviours from this class.
 */
export class FaceBehaviour extends Behaviour {
    onResultUpdated(_filter: Facefilter) {
        // const mouth = filter.getBlendshapeValue("jawOpen");
        // console.log(mouth)
    }
}



declare type MeshWithBlendshapes = Mesh & {
    morphTargetInfluences: number[];
    morphTargetDictionary: { [key: string]: number };
}

declare type BlendshapeMap = Partial<Record<BlendshapeName, string>>;

export class FaceBlendshapes extends FaceBehaviour {

    // TODO: expose in Unity
    @serializable()
    blendshapeMap: BlendshapeMap = {};

    private _skinnedMeshes: MeshWithBlendshapes[] = [];

    onEnable(): void {
        this._skinnedMeshes = [];
        this.gameObject.traverse((child) => {
            if (child instanceof SkinnedMesh || child instanceof Mesh) {
                const mesh = child as MeshWithBlendshapes;
                if (mesh.morphTargetDictionary && mesh.morphTargetInfluences)
                    this._skinnedMeshes.push(mesh);
            }
        });
    }

    onResultUpdated(filter: Facefilter) {

        // TODO: handle multiple faces
        const face = filter.result?.faceBlendshapes?.[0]
        if (face) {
            // we iterate all blendshape values and set the corresponding morph target influence
            // some meshes might have different names so we need to remap them
            for (const shape of face.categories) {
                const name = shape.categoryName;
                const remappedName = name; // TODO
                for (const mesh of this._skinnedMeshes) {
                    const index = mesh.morphTargetDictionary[remappedName];
                    if (index !== undefined && index !== null) {
                        let value = shape.score;

                        // The eye blink values seem to never exceed ranges between 0 (totally open) and 0.5 (totally closed)   
                        if (remappedName.includes("eyeBlink")) {
                            value = value * 1.5;
                        }

                        mesh.morphTargetInfluences[index] = value;
                    }
                    else {
                        if (this.context.time.frameCount % 180 === 0)
                            console.warn(`No morph target found for blendshape ${name}`, mesh.morphTargetDictionary)
                    }
                }
            }
        }

    }
}



export class FaceAnimator extends FaceBehaviour {

    private _animators: Animator[] = [];

    awake(): void {
        this._animators = this.gameObject.getComponentsInChildren(Animator);
    }

    onResultUpdated(filter: Facefilter) {
        if (!this._animators?.length) return;

        const face = filter.result?.faceBlendshapes?.[0]
        if (face) {
            // we iterate all blendshape values and set the corresponding morph target influence
            // some meshes might have different names so we need to remap them
            for (const shape of face.categories) {
                const name = shape.categoryName;
                for (const anim of this._animators) {
                    // if(name.includes("jawOpen")) console.log(shape.score)
                    anim.setFloat(name, shape.score);
                }
            }
        }
    }


}