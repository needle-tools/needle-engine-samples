import { AssetReference, Behaviour, GameObject, getParam, serializable } from "@needle-tools/engine";

export class ModelLoading extends Behaviour {

    @serializable(GameObject)
    parent?: GameObject;

    start(): void {

        const param = getParam("model");
        const url = (param as string) || 
            "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Embedded/DamagedHelmet.gltf";
            
        const asset = AssetReference.getOrCreate("Damaged Helmet", url, this.context);
        asset.instantiate(this.parent);
    }
}