import { Behaviour, GameObject, serializable } from "@needle-tools/engine";
import { Object3D } from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class ModelLoading extends Behaviour {

    /* url : string = ""; */
    
    @serializable(GameObject)
    parent?: GameObject;

    start(): void {
        const model = new GLTFLoader().load("http://chrisstman.eu/Temp/ToyCar.glb", (gltf) => {   
            // TODO: explain that gltf can contain a scene or a model(s)?

            this.parent?.add(gltf.scene);
        });
    }
}