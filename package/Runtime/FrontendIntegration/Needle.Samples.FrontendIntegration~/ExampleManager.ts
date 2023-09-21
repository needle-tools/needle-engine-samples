import { Behaviour, Mathf, Rigidbody, WaitForSeconds, randomNumber, serializable, showBalloonMessage } from "@needle-tools/engine";
import { Vector3 } from "three";

export class ExampleManager extends Behaviour {

    @serializable(Rigidbody)
    objects: Rigidbody[] = [];

    static get instance() {
        return this._instance;
    }
    private static _instance: ExampleManager;

    constructor() {
        super();
        ExampleManager._instance = this;

        // @ts-ignore
        const ui = window.UI;
        if(ui.interactButton instanceof HTMLElement) {
            ui.interactButton.onclick = () => { console.log("Needle has used the UI Object to get the button reference!"); };
        }
    }

    private tempVec = new Vector3(0, 0, 0);
    private calculateVector(power: number): Vector3 {
        this.tempVec.set(randomNumber(-1, 1), randomNumber(-1, 1), randomNumber(-1, 1)); //create a random unit vector
        this.tempVec.normalize();
        this.tempVec.multiplyScalar(power); //multiply by power
        return this.tempVec;
    }
    interact(power: number) {
        this.objects.forEach(obj => {
            obj.setVelocity(this.calculateVector(power));
            obj.setAngularVelocity(this.calculateVector(power));
        });
    }
}

// this method is exported inside the package.json main file
export function getRandomPower() {
    return randomNumber(1, 10);
}