import { Behaviour, Mathf, RectTransform, serializable } from "@needle-tools/engine";
import { Vector2 } from "three";

export class AspectRatioFitterUI extends Behaviour {
    
    @serializable(RectTransform)
    rectTransform?: RectTransform;

    @serializable(Vector2)
    safeArea: Vector2 = new Vector2(0,0);

    // TODO: on resize
    update() {
        const deltaX = this.context.domWidth / this.safeArea.x;
        const deltaY = this.context.domHeight / this.safeArea.y;

        const scale = Mathf.clamp(Math.min(deltaX, deltaY), 0, 1);
        
        this.rectTransform?.shadowComponent?.scale.setScalar(scale);
    }
}