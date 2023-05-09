import { AssetReference, Behaviour, GameObject, RectTransform, delay, serializable } from "@needle-tools/engine";
import { Object3D } from "three";

export class Cards extends Behaviour {

    @serializable(AssetReference)
    prefab?: AssetReference;

    @serializable(Object3D)
    container: Object3D;

    async awake() {

        while(true){
            await delay(300);
            if(Math.random() > .5){
                await this.prefab?.instantiate(this.container!);
            }
            else {
                const randomChild = this.container.children[Math.floor(Math.random() * this.container.children.length)];
                GameObject.destroy(randomChild);
            }
        }

        for (let i = 0; i < 10; i++)
        {
            await this.prefab?.instantiate(this.container!);
            await delay(1000);
        }
            
    }


}