import { AssetReference, Behaviour, GameObject, getParam, serializable, setParamWithoutReload } from "@needle-tools/engine";
import { Object3D } from "three";

export class ModelLoading extends Behaviour {

    @serializable(GameObject)
    parent?: GameObject;

    private currentObject: GameObject | null = null;

    start(){
        this.loadFromParam();
    }

    load() {

        this.downloadAndApply("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Embedded/DamagedHelmet.gltf");
    }

    loadFromParam() {

        const url = getParam("model") as string
        if (url && url != "")
            this.downloadAndApply(url);
    }

    async downloadAndApply(url: string) {
        const asset = AssetReference.getOrCreate(this.sourceId ?? url, url, this.context);

        const instance = await asset.instantiate(this.parent) as GameObject;

        this.currentObject?.destroy();
        this.currentObject = instance;

        setParamWithoutReload("model", url);
    }
}