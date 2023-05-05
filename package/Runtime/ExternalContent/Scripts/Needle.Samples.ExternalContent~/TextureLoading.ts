import { Behaviour, ImageReference, Renderer, getParam, serializable, setParamWithoutReload } from "@needle-tools/engine";
import { Material, RepeatWrapping, Vector2, sRGBEncoding } from "three";

export class TextureLoading extends Behaviour {
    @serializable(Renderer)
    targetRenderer?: Renderer;

    start() {
        this.loadFromParam();
    }

    public load() {
        this.downloadAndApply("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/screenshot/screenshot.png")
    }

    public loadFromParam() {
        const url = getParam("texture");
        if (typeof url === "string" && url?.length > 0)
            this.downloadAndApply(url);
    }

    async downloadAndApply(url: string) {
        const image = ImageReference.getOrCreate(url);

        const texture = await image.createTexture();

        if (this.targetRenderer && texture) {
            texture.encoding = sRGBEncoding;
            texture.repeat = new Vector2(1, -1);
            texture.wrapT = RepeatWrapping;

            this.targetRenderer.sharedMaterial["map"] = texture;
            this.targetRenderer.sharedMaterial.needsUpdate = true;
        }

        if(texture) setParamWithoutReload("texture", url);
    }
}