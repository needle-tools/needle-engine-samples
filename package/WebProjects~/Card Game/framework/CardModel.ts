import { AssetReference, ImageReference, serializable } from "@needle-tools/engine";
import { Ability } from "./Ability";

export class CardModel {
    private _name?: string;
    get name() {
        if (this._name !== undefined) return this._name;
        let name = this.model?.uri?.split("/").pop();
        if (name) {
            name = name.split(".")[0];
            return this._name = name;
        }
        return this.model.uri;
    }

    get id() {
        return this.model?.uri ?? "";
    }

    @serializable(ImageReference)
    image!: ImageReference;

    @serializable(AssetReference)
    model!: AssetReference;

    idleAnimation?: string;

    @serializable(Ability)
    abilities: Ability[] = [];

    async createTexture() {
        if (this.image)
            return this.image.createTexture();
        return null;
    }
}
