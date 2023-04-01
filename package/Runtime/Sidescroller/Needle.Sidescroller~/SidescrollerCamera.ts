import { Behaviour, Camera, GameObject, serializable, SpriteRenderer } from "@needle-tools/engine";
import { Mathf } from "@needle-tools/engine/src/engine/engine_math";
import { Vector3 } from "three";
import { SidescrollerCharacter } from "./SidescrollerCharacter";

// Documentation → https://docs.needle.tools/scripting

export class SidescrollerCamera extends Behaviour {

    @serializable()
    target: GameObject | null = null;

    @serializable()
    followStrength: number = 1; 
    
    private targetY: number = 0;
    private renderers: SpriteRenderer[] = [];
    private cam: Camera | null = null;

    onEnable() {
        this.targetY = this.gameObject.transform.position.y;

        // collect all SpriteRenderer
        this.renderers = GameObject.findObjectsOfType(SpriteRenderer);
        this.cam = this.gameObject.getComponent(Camera);
    }

    private alignedTargetPosition: Vector3 = new Vector3();
    update() {
        const wheelChange = this.context.input.getMouseWheelDeltaY();
        this.targetY += wheelChange * 0.04;
        const minY = 1;
        const maxY = 40;
        if (this.targetY < minY) this.targetY = minY;
        if (this.targetY > maxY) this.targetY = maxY;

        if (this.target) {
            const p = this.gameObject.transform.position; 
            const targetP = this.target.transform.position;
            p.x = Mathf.lerp(p.x, targetP.x, this.context.time.deltaTime * this.followStrength);
            p.y = Mathf.lerp(p.y, this.targetY, this.context.time.deltaTime * this.followStrength);
            
            // rotate around y depending on how far up we are

            this.alignedTargetPosition.copy(targetP);
            this.alignedTargetPosition.x = p.x;
            this.alignedTargetPosition.y = 1;
            this.gameObject.lookAt(this.alignedTargetPosition);
            if (this.cam) this.cam.fieldOfView = Mathf.lerp(18, 9, Mathf.inverseLerp(minY, maxY, p.y));

            for (const renderer of this.renderers) {
                renderer.gameObject.quaternion.copy(this.gameObject.quaternion);

                // compare Z position
                const z = renderer.gameObject.transform.position.z;
                const zDiff = z - targetP.z;
                let mapping = zDiff / (p.y * 0.2);
                if (mapping > zDiff) mapping = zDiff;

                // set opacity based on distance
                const material = renderer.sharedMaterial;
                if (material) {
                    material.opacity = Mathf.clamp01(Mathf.inverseLerp(4, 3, mapping));
                }
            }
        }
    }
}