import { Behaviour, GameObject, Mathf, Text, serializable } from "@needle-tools/engine";
import { Object3D } from "three";

export class VariantSwitcher extends Behaviour {
    static change = "change";

    @serializable(Object3D)
    objects: Object3D[] = [];

    @serializable()
    hideContentOnStart: boolean = true;

    @serializable()
    autoDetectContent: boolean = false;

    // @nonSerialized
    get index() { return this._index; }
    private _index = -1;
    
    awake(): void {
        if (!this.hideContentOnStart) {
            this._index = 0;
        }

        if (this.objects.length === 0 && this.autoDetectContent) {
            this.objects = this.gameObject.children;
        }

        this.apply();
    }

    next() {
        this._index++;

        if (this._index >= this.objects.length) {
            this._index = 0;
        }

        this.apply();
    }

    previous() {
        this._index--;

        if (this._index < 0) {
            this._index = this.objects.length - 1;
        }

        this.apply();
    }

    apply() {
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].visible = i === this._index;
        }
        this.dispatchEvent(new Event(VariantSwitcher.change));
    }

    select(index: number) {
        this._index = index;
        this._index = Mathf.clamp(this._index, 0, this.objects.length - 1);
        this.apply();
    }
}