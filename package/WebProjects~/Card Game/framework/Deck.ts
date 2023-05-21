import { AssetReference, Behaviour, Camera, GameObject, Image, ImageReference, RectTransform, getComponent, serializable } from "@needle-tools/engine";
import { Object3D } from "three";
import { Card } from "./Card";
import { CardModel } from "./CardModel";


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

    @serializable(RectTransform)
    container!: RectTransform;

    //@serializeField
    @serializable(CardModel)
    private cardModels: CardModel[] = [];

    awake(): void {
        const ch = this.container.gameObject.children;
        for (let i = ch.length - 1; i >= 0; i--) GameObject.destroy(ch[i]);
        console.log(this);
    }

    start() {
        for (const cb of Deck._onInitialize) {
            cb(this);
        }
    }

    activate() {
        this.isActive = true;
        this.initializeDeck();
    }
    deactivate() {
        this.isActive = false;
        for (const card of this._activeCards) {
            GameObject.destroy(card.gameObject);
        }
        this._activeCards.length = 0;
    }

    update(): void {
        for (const card of Deck._createdCards) {
            this.cardModels.push(card);
        }
        Deck._createdCards.length = 0;

        if (this.isActive) {
            for (let i = 0; i < this._activeCards.length; i++) {
                const card = this._activeCards[i];
                if (card.destroyed) {
                    this._activeCards.splice(i, 1);
                    i--;
                }
            }
        }
    }

    private _activeCards: Card[] = [];

    initializeDeck() {
        for (const active of this._activeCards) {
            GameObject.destroy(active.gameObject);
        }
        this._activeCards.length = 0;
        for (let i = 0; i < this.minCards; i++) {
            this.createCard();
        }
    }

    addToDeck(card: Card) {
        card.gameObject.visible = true;
        console.log(card.gameObject.position);
        // card.gameObject.position.set(0, 0, 0);
        // this.container.add(card.gameObject);
    }

    async createCard() {
        const index = Math.floor(Math.random() * this.cardModels.length);
        // const index = this.i++ % this.cardModels.length;
        const instance = await this.prefab?.instantiate(this.container!.gameObject) as GameObject;
        const card = getComponent(instance, Card) as Card;
        this._activeCards.push(card);
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
    }

    getModel(id: string) {
        return this.cardModels.find(c => c.id === id);
    }
}
