// START MARKER network color change
import { Behaviour, IPointerClickHandler, PointerEventData, Renderer, serializable, showBalloonMessage, syncField } from "@needle-tools/engine";
import { Color } from "three"

export class Networking_ClickToChangeColor extends Behaviour implements IPointerClickHandler {

    // START MARKER network color change syncField
    /** syncField does automatically send a property value when it changes */
    @syncField(Networking_ClickToChangeColor.prototype.onColorChanged)
    @serializable(Color)
    color!: Color;

    private onColorChanged() {
        // syncField will network the color as a number, so we need to convert it back to a Color when we receive it
        if (typeof this.color === "number")
            this.color = new Color(this.color);
        this.setColorToMaterials();
    }
    // END MARKER network color change syncField

    /** called when the object is clicked and does generate a random color */
    onPointerClick(_: PointerEventData) {
        const randomColor = new Color(Math.random(), Math.random(), Math.random());
        this.color = randomColor;
    }

    onEnable() {        
        showBalloonMessage(`<strong>Click an object</strong> to change the color. Open this window in another browser tab/window to see the networking in action...`);
        this.setColorToMaterials();
    }

    private setColorToMaterials() {
        const renderer = this.gameObject.getComponent(Renderer);
        if (renderer) {
            for (let i = 0; i < renderer.sharedMaterials.length; i++) {
                // we clone the material so that we don't change the original material
                // just for demonstration purposes, you can also change the original material
                const mat = renderer.sharedMaterials[i]?.clone();
                renderer.sharedMaterials[i] = mat;
                if (mat && "color" in mat)
                    mat.color = this.color;
            }
        }
        else console.warn("No renderer found", this.gameObject)
    }

}
// END MARKER network color change

// START MARKER network syncfield array
export class Networking_StringArray extends Behaviour {

    @syncField(Networking_StringArray.prototype.onArrayChanged)
    private myArray: string[] = [];

    private onArrayChanged() {
        console.log("< Received array", this.myArray[this.myArray.length - 1], this.myArray);
        showBalloonMessage(`<strong>< Received</strong> \"${this.myArray[this.myArray.length - 1]}\", we now have ${this.myArray.length} elements`)
    }

    start(): void {
        showBalloonMessage("Open this window in another browser tab/window to see the networking in action...");
        setInterval(this.updateArray, 4000);
    }

    private updateArray = () => {
        const currentTime = new Date().toLocaleTimeString();
        console.log("> Update array", currentTime);

        // Just for demonstration we clear the array when we reach 10 entries
        if (this.myArray.length > 10) {
            console.log("Clearing array because we have reached 10 entries")
            this.myArray.length = 0;
        }

        this.myArray.push(currentTime);
        // Assign the array again to trigger a change and send the array.
        this.myArray = this.myArray;

        showBalloonMessage(`<strong>> Send</strong> \"${currentTime}\", ${this.myArray.length} elements`)
    }
}
// END MARKER network syncfield array



// START MARKER network syncfield array
class MyObject {
    name: string = "";
    age: number = 0;
}

export class Networking_Object extends Behaviour {

    @syncField(Networking_Object.prototype.onObjectChanged)
    private myObject: MyObject = new MyObject();

    private onObjectChanged() {
        console.log("< Received object", this.myObject);
        showBalloonMessage(`<strong>< Received</strong> \"${this.myObject.name}\" is ${this.myObject.age} years old`)
    }

    awake(): void {
        showBalloonMessage("Open this window in another browser tab/window to see the networking in action...");
        setInterval(this.updateObject, 5000);
    }

    private updateObject = () => {
        this.myObject.name = this.context.connection.connectionId!;
        this.myObject.age += 1;
        // Assign the object again to trigger a change and send the object
        this.myObject = this.myObject;
        console.log("> Updated", this.myObject);
        showBalloonMessage("<strong>> Sent</strong> \"" + this.myObject.name + "\" is " + this.myObject.age + " years old")
    }
}
// END MARKER network syncfield array