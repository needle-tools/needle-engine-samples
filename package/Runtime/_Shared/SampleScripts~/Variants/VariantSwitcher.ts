import { Behaviour, GameObject, Mathf, Text, getParam, serializable, setParamWithoutReload, syncField } from "@needle-tools/engine";
import { Object3D } from "three";
import { VariantInfo } from "./VariantInfo";

export class VariantSwitcher extends Behaviour {
    @serializable(Object3D)
    objects: Object3D[] = [];

    @serializable()
    hideContentOnStart: boolean = true;

    @serializable(Text)
    lable?: Text;

    @syncField(function (this: VariantSwitcher) { this.apply(); }) // < networking index, when index changes remotely we just apply the new value
    private index = -1;

    awake(): void {
        if (!this.hideContentOnStart) {
            this.index = 0;
        }

        const param = getParam("variant");
        if (typeof param === "string") this.index = parseInt(param);
        else if (typeof param === "number") this.index = param;

        this.apply();
    }

    next() {
        this.select(this.index + 1);
    }

    previous() {
        this.select(this.index - 1);
    }

    apply() {
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].visible = i === this.index;
        }

        if (this.lable) {
            const obj = this.objects[this.index];
            if (obj) {
                const info = GameObject.getComponent(obj, VariantInfo);
                this.lable.text = info?.displayName ?? obj.name;
            }
        }
    }

    select(index: number) {
        if (index < 0) index = this.objects.length - 1;
        this.index = index % this.objects.length;
        this.index = Mathf.clamp(this.index, 0, this.objects.length - 1);
        setParamWithoutReload("variant", this.index.toString());
        this.apply();
    }
}