import { Behaviour, serializable } from "@needle-tools/engine";
import { Material } from "three";

declare type MyCustomShaderMaterial = Material & {
    _Speed: number;
};

export class IncreaseShaderSpeedOverTime extends Behaviour {

    //@type UnityEngine.Material
    @serializable(Material)
    myMaterial?: MyCustomShaderMaterial;

    update() {
        if (this.myMaterial) {
            this.myMaterial._Speed *= 1 + this.context.time.deltaTime;
            if(this.myMaterial._Speed > 1) this.myMaterial._Speed = .0005;
            if(this.context.time.frame % 30 === 0) console.log(this.myMaterial._Speed)
        }
    }
}