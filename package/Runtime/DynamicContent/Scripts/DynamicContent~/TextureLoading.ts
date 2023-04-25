import { Behaviour, ImageReference, Renderer, getParam, serializable } from "@needle-tools/engine";
import { Material, RepeatWrapping, Vector2, sRGBEncoding } from "three";

const param = getParam("texture");

export class TextureLoading extends Behaviour {
    @serializable(Renderer)
    targetRenderer?: Renderer;

    public load() {
        this.downloadAndApply("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/screenshot/screenshot.png")
    }

    public loadFromParam() {
        const url = param as string
        if(url && url != "")
            this.downloadAndApply(url);
    }

    downloadAndApply(url: string) {
        const image = ImageReference.getOrCreate(url);

        image.createTexture().then(texture => {
            if(this.targetRenderer && texture)
            {
                texture.encoding = sRGBEncoding;
                texture.repeat = new Vector2(1, -1);
                texture.wrapT = RepeatWrapping;

                this.targetRenderer.sharedMaterial["map"] = texture;
                this.targetRenderer.sharedMaterial.needsUpdate = true;
            }
        }, (err) => { console.log("Error while loading the texture", err) });
    }
}