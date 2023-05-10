import { AssetReference, Behaviour, Camera, GameObject, Image, ImageReference, getComponent, serializable } from "@needle-tools/engine";
import { Object3D } from "three";
import { Card } from "./Card";


export class CardModel {
    @serializable(ImageReference)
    image!: ImageReference;

    @serializable(AssetReference)
    model!: AssetReference;

    @serializable(Animation)
    idle?: Animation;

    async createTexture() {
        return this.image.createTexture();
    }
}

export type DeckInitializeCallback = (deck: Deck) => void;

export class Deck extends Behaviour {

    private static _onInitialize: DeckInitializeCallback[] = [];

    static onInitialize(cb: DeckInitializeCallback) {
        this._onInitialize.push(cb);
    }

    static createCard(model: string, cardImage: string) {
        const card = new CardModel();
        card.model = new AssetReference(model);
        card.image = new ImageReference(cardImage);
        return card;
    }

    @serializable(AssetReference)
    prefab?: AssetReference;

    @serializable(Object3D)
    container!: Object3D;

    @serializable(CardModel)
    cardModels: CardModel[] = [];

    awake(): void {
        const ch = this.container.children;
        for (let i = ch.length - 1; i >= 0; i--) GameObject.destroy(ch[i]);
    }

    start() {
        for (const cb of Deck._onInitialize) {
            cb(this);
        }
    }

    update(): void {
        if (this.container.children.length < 7) {
            this.createCard();
        }
    }

    private _creatingACard = false;
    // private i: number = 0;

    async createCard() {
        if (this._creatingACard) return;
        this._creatingACard = true;
        const index = Math.floor(Math.random() * this.cardModels.length);
        // const index = this.i++ % this.cardModels.length;
        const instance = await this.prefab?.instantiate(this.container!) as GameObject;
        const card = getComponent(instance, Card) as Card;
        const model = this.cardModels[index];
        card.model = model;
        const visual = card.rendering;
        if (visual) {
            const image = visual.gameObject.getComponentInChildren(Image) as Image;
            image.image = await model.createTexture();
            image.color.set(0xffffff);
            if (image.shadowComponent)
                image.shadowComponent.scale.y *= -1;
        }
        if (card.text) {
            card.text.text = model.model.uri;
        }
        this._creatingACard = false;
    }

}
