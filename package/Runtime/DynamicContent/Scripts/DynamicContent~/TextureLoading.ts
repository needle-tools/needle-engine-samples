import { Behaviour, ImageReference, getParam, serializable } from "@needle-tools/engine";
import { Material } from "three";

export class TextureLoading extends Behaviour {

    @serializable(Material)
    targetMaterial?: Material;

    public start() {

        const param = getParam("image");
        const url = (param as string) ||
            "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/screenshot/screenshot.png";

        const image = ImageReference.getOrCreate(url);
        image.createTexture().then(texture => {
            if(this.targetMaterial)
                this.targetMaterial["map"] = texture;
        });
    }
}