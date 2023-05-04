import { Behaviour, Camera, GameObject, serializable, SpriteRenderer } from "@needle-tools/engine";
import { Mathf } from "@needle-tools/engine";
import { Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

export class SidescrollerCamera extends Behaviour {

    @serializable()
    target: GameObject | null = null;

    @serializable()
    followStrength: number = 1; 
    
    private targetY: number = 0;
    private renderers: SpriteRenderer[] = [];
    private cam: Camera | null = null;
    private alignedTargetPosition: Vector3 = new Vector3();
    private gamepadIndex: number | null = null;

    onEnable() {
        this.targetY = this.gameObject.transform.position.y;

        // collect all SpriteRenderers so we can align them to the camera later
        this.renderers = GameObject.findObjectsOfType(SpriteRenderer);
        this.cam = this.gameObject.getComponent(Camera);
    }

    start() {
        window.addEventListener("gamepadconnected", (e) => {
            // https://w3c.github.io/gamepad/#remapping
            if (e.gamepad.mapping == "standard") this.gamepadIndex = e.gamepad.index; 
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            if (this.gamepadIndex == e.gamepad.index) this.gamepadIndex = null;
        });
    }

    update() {

        this.handleMouseWheel();
        this.handlePinch();
        this.handleGamepad();

        const minY = 1;
        const maxY = 40;
        if (this.targetY < minY) this.targetY = minY;
        if (this.targetY > maxY) this.targetY = maxY;

        if (this.target) {
            // camera smoothly follows the player
            const p = this.gameObject.transform.position; 
            const targetP = this.target.transform.position;
            p.x = Mathf.lerp(p.x, targetP.x, this.context.time.deltaTime * this.followStrength);
            p.y = Mathf.lerp(p.y, this.targetY, this.context.time.deltaTime * this.followStrength);
            
            // camera smoothly looks at player
            this.alignedTargetPosition.x = p.x;
            this.alignedTargetPosition.y = 1;
            this.alignedTargetPosition.z = Mathf.lerp(this.alignedTargetPosition.z, targetP.z, this.context.time.deltaTime * this.followStrength);
            this.gameObject.lookAt(this.alignedTargetPosition);

            // field of view is designed for 16:9
            // we adjust it a bit depending on the aspect ratio to see more on portrait screens
            let aspectCorrection = 1;
            const aspect = this.context.domWidth / this.context.domHeight;
            if (aspect < 1)
                aspectCorrection = 2.0;

            // zoom in/out depending on camera height
            if (this.cam) this.cam.fieldOfView = Mathf.lerp(18, 9, Mathf.inverseLerp(minY, maxY, p.y)) * aspectCorrection;

            // align all sprites to look at the camera plane
            for (const renderer of this.renderers) {
                renderer.gameObject.quaternion.copy(this.gameObject.quaternion);

                // set opacity of sprites based on distance to camera plane
                const z = renderer.gameObject.transform.position.z;
                const zDiff = z - targetP.z;
                let mapping = zDiff / (p.y * 0.2);
                if (mapping > zDiff) mapping = zDiff;
                const material = renderer.sharedMaterial;
                if (material) {
                    material.opacity = Mathf.clamp01(Mathf.inverseLerp(4, 3, mapping));
                }
            }
        }
    }

    private handleMouseWheel() {
        const wheelChange = this.context.input.getMouseWheelDeltaY();
        this.targetY += wheelChange * 0.04;
    }

    private handleGamepad() {
        if (this.gamepadIndex === null) return;
        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (!gamepad) return;

        // Gamepads usually return small values all the time - they're not perfectly centered.
        // So a "deadzone" is used to ignore small values.
        const deadzone = 0.25;
        if (Math.abs(gamepad.axes[3]) > deadzone)
        this.targetY -= gamepad.axes[3] * 1.5;
    }

    private hadDataLastFrame = false;
    private lengthLastFrame = 0;
    private handlePinch() {
        if (this.context.input.getTouchesPressedCount() == 2) {
            
            const delta0 = this.context.input.getPointerPosition(0)!;
            const delta1 = this.context.input.getPointerPosition(1)!;
            const lengthThisFrame = delta0.distanceTo(delta1);

            if (this.hadDataLastFrame) {
                const delta = lengthThisFrame - this.lengthLastFrame;
                this.targetY -= delta * 1;
            }

            this.lengthLastFrame = lengthThisFrame;
            this.hadDataLastFrame = true;
        }
        else {
            this.hadDataLastFrame = false;
        }
    }
}
