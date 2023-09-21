import { Behaviour, isDevEnvironment, serializable } from "@needle-tools/engine";
import { Object3D } from "three";

 // START MARKER react to resize window
export class ResponsiveContent extends Behaviour {

    @serializable(Object3D)
    content?: Object3D;

    @serializable()
    referenceSize: number = 512;

    onEnable(): void {
        window.addEventListener("resize", this.updateSize);
        this.updateSize();
    }
    
    onDisable(): void {
        window.removeEventListener("resize", this.updateSize);
    }

    private updateSize = () => {
        if (this.content) {
            if (this.referenceSize <= 0) return console.error("ResponsiveContent: Base width must be greater than 0.");
            const scale = this.context.domWidth / this.referenceSize;
            this.content.scale.set(scale, scale, scale);
        }
        else if (isDevEnvironment()) console.warn("ResponsiveContent: No content object set.");
    };
}
// END MARKER react to resize window