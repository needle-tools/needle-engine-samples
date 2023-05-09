import { AssetReference, Behaviour, Camera, GameObject, Image, ImageReference, getComponent, serializable } from "@needle-tools/engine";
import { Object3D } from "three";
import { Card } from "./Card";

export class Deck extends Behaviour {

    @serializable(AssetReference)
    prefab?: AssetReference;

    @serializable(ImageReference)
    textures: ImageReference[] = [];

    @serializable(Object3D)
    container: Object3D;

    update(): void {
        if (this.container.children.length < 7) {
            this.createCard();
        }
    }

    private _creatingACard = false;
    async createCard() {
        if (this._creatingACard) return;
        this._creatingACard = true;
        const randomIndex = Math.floor(Math.random() * this.textures.length);
        const instance = await this.prefab?.instantiate(this.container!) as GameObject;
        const card = getComponent(instance, Card) as Card;
        const visual = card.rendering;
        if (visual) {
            const image = visual.gameObject.getComponentInChildren(Image) as Image;
            image.image = await this.textures[randomIndex].createTexture();
        }
        this._creatingACard = false;
    }

}
