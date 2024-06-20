import { Behaviour, Mathf, Rigidbody, WaitForSeconds, randomNumber, serializable, showBalloonMessage } from "@needle-tools/engine";
import { Vector3 } from "three";

// This class is a Behaviour, which means it can be attached to a GameObject
// and has a lifecycle (onEnable, start, onDisable, update, lateUpdate etc.)
export class ExampleManager extends Behaviour {

    private objects: Rigidbody[] = [];

    get objectsCount() { return this.objects.length; }

    awake(){
        this.objects = this.gameObject.getComponentsInChildren(Rigidbody);
    }

    private ui?: HTMLElement;
    setReferenceToHTMLElement(element: HTMLElement) {
        // We now have a reference to the button, and can listen to events, modify it directly, keep it for later, etc.
        // "HTMLElement" is a type that comes from the browser, not from Needle Engine.
        this.ui = element;

        // Register to events on the HTML element
        this.ui.addEventListener("pointerover", () => {
            console.log("Hovered over the element!");
        });
    }

    interact(power: number) {
        this.objects = this.gameObject.getComponentsInChildren(Rigidbody);
        // Apply a force to all objects based on where they are
        this.objects.forEach(obj => {
            obj.setVelocity(this.getRandomUnitVector(power));
            obj.setAngularVelocity(this.getRandomUnitVector(power));
        });

        // Approach 1: We can directly modify the HTML element from here, e.g. add a class
        this.ui?.classList.add("active");
        setTimeout(() => {
            // we remove the class again after some delay
            this.ui?.classList.remove("active");
        }, 500);

        // Approach 2: We can dispatch an event that other code can listen to
        this.dispatchEvent(new CustomEvent("interact", {
            detail: {
                objects: this.objects 
            } 
        }));
    }

    private tempVec = new Vector3(0, 0, 0);
    private getRandomUnitVector(power: number): Vector3 {
        // create a random unit vector
        this.tempVec.set(randomNumber(-1, 1), randomNumber(-1, 1), randomNumber(-1, 1)); 
        this.tempVec.normalize();
        // multiply by power
        this.tempVec.multiplyScalar(power);
        return this.tempVec;
    }
}

// This method is exported so that it can be used by other scripts
export function getRandomPower() {
    return randomNumber(1, 10);
}