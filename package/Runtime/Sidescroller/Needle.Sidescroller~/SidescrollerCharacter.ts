import { Animator, Behaviour, serializable } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

class InputValue {
    value: number = 0;
}

export class SidescrollerCharacter extends Behaviour {

    @serializable()
    speed: number = 1;

    @serializable()
    leftKey: string = "ArrowLeft";
    @serializable()
    rightKey: string = "ArrowRight";
    @serializable()
    upKey: string = "ArrowUp";
    @serializable()
    downKey: string = "ArrowDown";

    private dir: number = 1;
    private animator: Animator | null = null;
    onEnable() {
        this.animator = this.gameObject.getComponent(Animator);
    }

    inputs = {
        horizontal: new InputValue(),
        vertical: new InputValue(),
    }

    lateUpdate() {
        const moveAmount = this.speed * this.context.time.deltaTime;
        const pos = this.gameObject.transform.position;
        const rot = this.gameObject.transform.rotation; 
        
        let haveMovement = false;  
        
        this.inputs.horizontal.value = 0;
        this.inputs.vertical.value = 0;

        if (this.context.input.getTouchesPressedCount() == 1) {
            this.handleKeyboard();
            this.handlePointer();
            this.dir = this.inputs.horizontal.value < 0 ? -1 : 1;
        }
        
        pos.x += this.inputs.horizontal.value * moveAmount;
        pos.z -= this.inputs.vertical.value * moveAmount;

        haveMovement = this.inputs.horizontal.value != 0 || this.inputs.vertical.value != 0;

        this.animator?.setBool("Moving", haveMovement);
        rot.y = this.dir < 0 ? 0 : Math.PI;
    }

    private handleKeyboardAxis(negative: string, positive: string, value: InputValue) {
        let offset = 0;
        if (this.context.input.isKeyPressed(negative)) {
            offset -= 1;
        }
        if (this.context.input.isKeyPressed(positive)) {
            offset += 1;
        }
        value.value += offset;
    }

    // very basic edge-of-screen implementation
    private handlePointer() {
        if (this.context.input.mousePressed) {
            const screenPos = this.context.input.mousePositionRC;
            if (screenPos.x < -0.25) {
                this.inputs.horizontal.value -= 1;
            }
            if (screenPos.x > 0.25) {
                this.inputs.horizontal.value += 1;
            }
            if (screenPos.y < -0.5) {
                this.inputs.vertical.value -= 1;
            }
            if (screenPos.y > 0.5) {
                this.inputs.vertical.value += 1;
            }
        }
    }

    private handleKeyboard() {
        this.handleKeyboardAxis("ArrowLeft", "ArrowRight", this.inputs.horizontal);
        this.handleKeyboardAxis("ArrowDown", "ArrowUp", this.inputs.vertical);
        
        // TODO input should be handled using .code instead of .keyCode, then we can support french/belgian layouts as well easily
        this.handleKeyboardAxis("a", "d", this.inputs.horizontal);
        this.handleKeyboardAxis("s", "w", this.inputs.vertical);
        
    }
}