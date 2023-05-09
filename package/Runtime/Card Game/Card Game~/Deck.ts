import { AssetReference, Behaviour, Camera, GameObject, Image, ImageReference, getComponent, serializable } from "@needle-tools/engine";
import { Object3D } from "three";
import { Card } from "./Card";

export class CardModel {
    @serializable(ImageReference)
    image!: ImageReference;

    @serializable(AssetReference)
    model!: AssetReference;

    async createTexture() {
        return this.image.createTexture();
    }
}

export class Deck extends Behaviour {

    @serializable(AssetReference)
    prefab?: AssetReference;

    @serializable(ImageReference)
    textures: ImageReference[] = [];

    @serializable(CardModel)
    cardModels: CardModel[] = [];

    @serializable(Object3D)
    container: Object3D;

    awake(): void {
        const ch = this.container.children;
        for (let i = ch.length - 1; i >= 0; i--) GameObject.destroy(ch[i]);
    }

    update(): void {
        if (this.container.children.length < 7) {
            this.createCard();
        }
    }

    private _creatingACard = false;
    async createCard() {
        if (this._creatingACard) return;
        this._creatingACard = true;
        const randomIndex = Math.floor(Math.random() * this.cardModels.length);
        const instance = await this.prefab?.instantiate(this.container!) as GameObject;
        const card = getComponent(instance, Card) as Card;
        const model = this.cardModels[randomIndex];
        card.model = model;
        const visual = card.rendering;
        if (visual) {
            const image = visual.gameObject.getComponentInChildren(Image) as Image;
            image.image = await model.createTexture();
            if (image.shadowComponent)
                image.shadowComponent.scale.y *= -1;
        }
        this._creatingACard = false;
    }

}
