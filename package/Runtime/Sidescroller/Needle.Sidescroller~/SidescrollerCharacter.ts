import { Animator, AudioSource, Behaviour, Mathf, serializable } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

class InputValue {
    value: number = 0;
}

export class SidescrollerCharacter extends Behaviour {

    @serializable()
    speed: number = 1;

    private dir: number = 1;
    private animator: Animator | null = null;
    private audio: AudioSource | null = null;
    private gamepadIndex: number | null = null;

    onEnable() {
        this.animator = this.gameObject.getComponent(Animator);
        this.audio = this.gameObject.getComponentInChildren(AudioSource);

        // ensure touch actions don't accidentally scroll/refresh the page
        this.context.domElement.style.userSelect = "none";
        this.context.domElement.style.touchAction = "none";
        this.context.renderer.domElement.style.touchAction = "none";
    }

    start() {
        window.addEventListener("gamepadconnected", (e) => {
            // https://w3c.github.io/gamepad/#remapping
            // we're always using the last connected gamepad here
            if (e.gamepad.mapping == "standard") this.gamepadIndex = e.gamepad.index; 
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            if (this.gamepadIndex == e.gamepad.index) this.gamepadIndex = null;
        });
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

        this.handleKeyboard();
        this.handleGamepad();
        if (this.context.input.getTouchesPressedCount() == 1) {
            this.handlePointer();
        }
        
        this.inputs.horizontal.value = Mathf.clamp(this.inputs.horizontal.value, -1, 1);
        this.inputs.vertical.value = Mathf.clamp(this.inputs.vertical.value, -1, 1);

        pos.x += this.inputs.horizontal.value * moveAmount;
        pos.z -= this.inputs.vertical.value * moveAmount;

        haveMovement = this.inputs.horizontal.value != 0 || this.inputs.vertical.value != 0;
        if (haveMovement)
            this.dir = this.inputs.horizontal.value < 0 ? -1 : 1;

        rot.y = this.dir < 0 ? 0 : Math.PI;
        if (this.animator)
            this.animator.setBool("Moving", haveMovement);
        if (this.audio) 
            this.audio.volume = Mathf.lerp(this.audio.volume, haveMovement ? 1 : 0, this.context.time.deltaTime * 20) * 0.5;
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

    private handleGamepad() {
        if (this.gamepadIndex === null) return;
        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (!gamepad) return;

        // Gamepads usually return small values all the time - they're not perfectly centered.
        // So a "deadzone" is used to ignore small values.
        const deadzone = 0.25;
        if (Math.abs(gamepad.axes[0]) > deadzone)
            this.inputs.horizontal.value += gamepad.axes[0] * 1.5;
        if (Math.abs(gamepad.axes[1]) > deadzone)
            this.inputs.vertical.value -= gamepad.axes[1] * 1.5;
    }

    private handleKeyboard() {
        this.handleKeyboardAxis("ArrowLeft", "ArrowRight", this.inputs.horizontal);
        this.handleKeyboardAxis("ArrowDown", "ArrowUp", this.inputs.vertical);
        
        // TODO input should be handled using .code instead of .keyCode, then we can support french/belgian layouts as well easily
        this.handleKeyboardAxis("a", "d", this.inputs.horizontal);
        this.handleKeyboardAxis("s", "w", this.inputs.vertical);
        
    }
}