import { Behaviour, GameObject, Mathf, Text, serializable } from "@needle-tools/engine";
import { Object3D } from "three";
import { VariantInfo } from "./VariantInfo";

export class VariantSwitcher extends Behaviour {
    @serializable(Object3D)
    objects: Object3D[] = [];

    @serializable()
    hideContentOnStart:boolean = true;

    @serializable(Text)
    lable?: Text;

    private index = -1;
    awake(): void {
        if (!this.hideContentOnStart)
            this.index = 0;

        this.apply();
    }
    
    next() {
        this.index++;

        if (this.index >= this.objects.length) {
            this.index = 0;
        }

        this.apply();
    }

    previous() {
        this.index--;

        if (this.index < 0) {
            this.index = this.objects.length - 1;
        }

        this.apply();
    }

    apply() {
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].visible = i === this.index;
        }

        if (this.lable) {
            const obj = this.objects[this.index];
            if (obj) {
                const info = GameObject.getComponent(obj, VariantInfo);
                let text = info?.displayName ?? obj.name;
                text = text.replace(/_/g, " ");
                this.lable.text = text;
            }
        }            
    }

    select(index: number) {
        this.index = index;
        this.index = Mathf.clamp(this.index, 0, this.objects.length - 1);
        this.apply();
    }
}