import { Behaviour, serializable } from "@needle-tools/engine";
import { Material, TextureLoader } from "three";

export class TextureLoading extends Behaviour {

    @serializable()
    url : string = "https://needle.tools/assets/needle-logo-256.97639e82.png";

    @serializable(Material)
    targetMaterial?: Material;

    public start() {

        if(this.targetMaterial)
            this.targetMaterial["map"] = new TextureLoader().load(this.url);
    }
}