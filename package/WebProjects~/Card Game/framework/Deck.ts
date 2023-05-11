import { AssetReference, Behaviour, Camera, GameObject, Image, ImageReference, getComponent, serializable } from "@needle-tools/engine";
import { Object3D } from "three";
import { Card } from "./Card";


export class CardModel {
    get id() {
        return this.model?.uri ?? "";
    }

    @serializable(ImageReference)
    image!: ImageReference;

    @serializable(AssetReference)
    model!: AssetReference;

    idleAnimation?: string;

    async createTexture() {
        if (this.image)
            return this.image.createTexture();
        return null;
    }
}

export type DeckInitializeCallback = (deck: Deck) => void;

export class Deck extends Behaviour {

    minCards: number = 3;
    isActive: boolean = false;

    private static _onInitialize: DeckInitializeCallback[] = [];
    private static _createdCards: CardModel[] = [];

    static onInitialize(cb: DeckInitializeCallback) {
        this._onInitialize.push(cb);
    }

    static createCard(model: string, cardImage: string) {
        const card = new CardModel();
        card.model = new AssetReference(model);
        card.image = new ImageReference(cardImage);
        this._createdCards.push(card);
        return card;
    }

    @serializable(AssetReference)
    prefab?: AssetReference;

    @serializable(Object3D)
    container!: Object3D;

    //@serializeField
    @serializable(CardModel)
    private cardModels: CardModel[] = [];

    awake(): void {
        const ch = this.container.children;
        for (let i = ch.length - 1; i >= 0; i--) GameObject.destroy(ch[i]);
    }

    start() {
        for (const cb of Deck._onInitialize) {
            cb(this);
        }
        console.log(this.cardModels);
    }

    update(): void {
        for (const card of Deck._createdCards) {
            this.cardModels.push(card);
        }
        Deck._createdCards.length = 0;

        if (this.isActive) {
            if (this.container.children.length < this.minCards) {
                this.createCard();
            }
        }
    }

    private _creatingACard = false;
    private i: number = 0;

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
            if (image.image)
                image.color.set(0xffffff);
            if (image.shadowComponent)
                image.shadowComponent.scale.y *= -1;
        }
        if (card.text) {
            let name = model.model.uri.split("/").pop();
            if (name) {
                name = name.split(".")[0];
                card.text.text = name;
            }
            else
                card.text.text = model.model.uri;
        }
        this._creatingACard = false;
    }

    getModel(id: string) {
        return this.cardModels.find(c => c.id === id);
    }
}
