import { Behaviour, ImageReference, serializable } from "@needle-tools/engine";
import { Material, TextureLoader, sRGBEncoding, Vector2, RepeatWrapping } from "three";

// For other formats then SDR images please refere to the three.js documentation
// https://threejs.org/docs/#api/en/loaders/TextureLoader

export class TextureLoading extends Behaviour {

    @serializable(ImageReference)
    imageRef?: ImageReference;

    @serializable(Material)
    targetMaterial?: Material;

    public start() {

        const loader = new TextureLoader();

        const url = this.imageRef?.url || "";

        const texture = loader.load(url);

        //Texture needs to be flipped vertically
        texture.repeat = new Vector2(1, -1); 

        //The Y axis wrapping has to be enabled
        texture.wrapT = RepeatWrapping; 

        //Default encoding is Linear
        texture.encoding = sRGBEncoding;

        if(this.targetMaterial)
            this.targetMaterial["map"] = texture;
    }
}