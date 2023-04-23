import { AssetReference, Behaviour, GameObject, serializable } from "@needle-tools/engine";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// For other formats then .glb please refere to the three.js documentation
// https://threejs.org/docs/#manual/en/introduction/Loading-3D-models

export class ModelLoading extends Behaviour {

    // This is just to pack the model with the build to request it later
    @serializable(AssetReference)
    modelRef?: AssetReference;

    @serializable(GameObject)
    parent?: GameObject;

    start(): void {

        if(!this.modelRef)
            return;

        const path = this.modelRef.uri;

        const loader = new GLTFLoader();
        loader.load(path, (gltf) => {   
            this.parent?.add(gltf.scene);
        });
    }
}