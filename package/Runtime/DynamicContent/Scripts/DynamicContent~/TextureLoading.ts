import { Behaviour, serializable } from "@needle-tools/engine";
import { Material, TextureLoader, sRGBEncoding, Vector2, RepeatWrapping } from "three";

export class TextureLoading extends Behaviour {

    @serializable()
    url : string = "https://needle.tools/assets/needle-logo-256.97639e82.png";

    @serializable(Material)
    targetMaterial?: Material;

    public start() {

        const loader = new TextureLoader();

        const texture = loader.load(this.url);

        //Texture needs to be flipped vertically
        texture.repeat = new Vector2(1, -1); 

        //The Y axis wrapping has to be enabled
        texture.wrapT = RepeatWrapping; 

        //Default encoding is Linear, we need to set it to sRGB
        texture.encoding = sRGBEncoding;

        if(this.targetMaterial)
            this.targetMaterial["map"] = texture;
    }
}