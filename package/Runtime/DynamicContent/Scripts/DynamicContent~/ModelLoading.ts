import { AssetReference, Behaviour, GameObject, getParam, serializable } from "@needle-tools/engine";

const param = getParam("model");

export class ModelLoading extends Behaviour {

    @serializable(GameObject)
    parent?: GameObject;

    private currentObject : GameObject | null = null;

    load() {

        this.downloadAndApply("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Embedded/DamagedHelmet.gltf");
    }

    loadFromParam() { 

        const url = param as string
        if(url && url != "")
            this.downloadAndApply(url);
    }

    downloadAndApply(url: string) {

        const asset = AssetReference.getOrCreate(url, url, this.context);

        asset.instantiate(this.parent)
             .then(obj => {
                this.currentObject?.destroy();
                this.currentObject = obj as GameObject
             });
    }
}