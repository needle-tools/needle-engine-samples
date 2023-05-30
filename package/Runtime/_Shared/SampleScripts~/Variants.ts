import { Behaviour, GameObject, serializable } from "@needle-tools/engine";

export class Variatns extends Behaviour {

    @serializable(GameObject)
    variants: GameObject[] = [];

    private currentIndex = 0;

    next() {
        this.currentIndex++;
        this.apply();
    }
    
    previous() {
        this.currentIndex--;
        this.apply();
    }

    validate() {
        if(this.currentIndex < 0) 
            this.currentIndex = this.variants.length - 1;
        else if(this.currentIndex >= this.variants.length) 
            this.currentIndex = 0;
    }

    apply() {

        this.validate();

        for (let i = 0; i < this.variants.length; i++) {
            GameObject.setActive(this.variants[i], i == this.currentIndex);
        } 
    }
}