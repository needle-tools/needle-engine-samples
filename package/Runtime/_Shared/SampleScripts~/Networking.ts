// START MARKER network color change
import { Behaviour, IPointerClickHandler, PointerEventData, Renderer, serializable, syncField } from "@needle-tools/engine";
import { Color } from "three"

export class Networking_ClickToChangeColor extends Behaviour implements IPointerClickHandler {

    // START MARKER network color change syncField
    /** syncField does automatically send a property value when it changes */
    @syncField(Networking_ClickToChangeColor.prototype.onColorChanged)
    @serializable(Color)
    color: Color;

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