import { serializable, Mathf, isMobileDevice, SyncedTransform, Camera, PlayerState, CapsuleCollider, PhysicsMaterial, CharacterController, Behaviour, Rigidbody } from "@needle-tools/engine";
import { Vector2, Vector3, Object3D, MathUtils } from "three";
import { PointerLock } from "./LockPointer";

export class FirstPersonController extends Behaviour {

    @serializable(CharacterController)
    controller?: CharacterController; 

    // used for vertical mouse movement. X rotational axis. Most probably the camera object.
    @serializable(Object3D)
    xRotTarget?: Object3D;

    // used for horizontal mouse movement. Y rotational axis. Most probably the player object with camera as its child.
    protected yRotTarget?: Object3D;

    @serializable()
    lookSensitivity: number = 1;

    @serializable()
    movementSpeed: number = 50;

    @serializable()
    sprintSpeed: number = 80;

    @serializable()
    stoppingDecay: number = 7;

    @serializable()
    maxSpeed: number = 7;

    @serializable()
    maxSprintSpeed: number = 7;

    @serializable()
    jumpSpeed: number = 5;

    // constrain the up-down movement in degrees
    @serializable()
    xRotClamp: Vector2 = new Vector2(-89, 89);

    // whether to get mouse delta from touch events
    // doesn't handle move, only look
    @serializable()
    enableTouchInput: boolean = true;

    @serializable()
    enableDesktopInput: boolean = true;

    @serializable()
    enableGamepadInput: boolean = true;

    @serializable()
    gamepadDeadzone: number = 0.25;

    @serializable()
    gamepadLookSensitivity: number = 50;

    protected playerState!: PlayerState;
    protected rigidbody!: Rigidbody;

    public lock!: PointerLock;

    protected isMobile: boolean = false;

    protected x : number = 0;
    protected y : number = 0;

    protected lookInput = new Vector2();
    protected moveInput = new Vector2();
    protected jumpInput = false;
    protected sprintInput = false;

    protected gamepadIndex: number | null = null;

    start(): void {
        // networking - get player state
        this.playerState = this.gameObject.getComponent(PlayerState)!;
        this.rigidbody = this.gameObject.getComponent(Rigidbody)!;
        
        if(this.isMultiplayer() && !this.playerState.hasOwner) {
            this.playerState.onFirstOwnerChangeEvent.addEventListener(() => this.initialize());
        }
        else {
            this.initialize();
        }
    }

    private isInitialized = false;
    initialize() {
        this.isInitialized = true;

        // rotation Y - get the root object
        this.yRotTarget = this.gameObject;

        this.isMobile = isMobileDevice();

        // abbility to contrain the mouse to the middle of the screen
        this.lock = new PointerLock(this.context.domElement);

        // adjust the sensitivity for mobile devices
        if (this.isMobile)
            this.lookSensitivity *= 2;

        const density = window.devicePixelRatio;

        if (density > 1)
            this.lookSensitivity *= density;

        
        if (this.isMobile) {
            // ensure touch actions don't accidentally scroll/refresh the page
            this.context.domElement.style.userSelect = "none";
            this.context.domElement.style.touchAction = "none";
            this.context.renderer.domElement.style.touchAction = "none";
        }

        // register mouse move events that work while being locked
        this.context.domElement.removeEventListener("pointermove", this.onPointerMove)
        if(this.enableDesktopInput) {
            this.context.domElement.addEventListener("pointermove", this.onPointerMove)
        }

        // register gamepad events
        window.addEventListener("gamepadconnected", (e) => {
            // https://w3c.github.io/gamepad/#remapping
            // we're always using the last connected gamepad here
            if (e.gamepad.mapping == "standard") this.gamepadIndex = e.gamepad.index; 
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            if (this.gamepadIndex == e.gamepad.index) this.gamepadIndex = null;
        });

        if(this.isLocalPlayer()) {
            this.gameObject.getComponent(SyncedTransform)?.requestOwnership();
        }
        else {
            this.setCharacter(false);
        }

        this.calculateYRot();
    }

    calculateYRot() { 
        //adjust Y to reflect the current rotation
        const charFwd = new Vector3();
        this.yRotTarget?.getWorldDirection(charFwd);
        charFwd.y = 0; // flatten
        charFwd.normalize();
        
        // calculate signed angle
        const wFwd = new Vector3(0, 0, 1);
        const wRight = new Vector3(1, 0, 0);
        const sign = wRight.dot(charFwd) > 0 ? 1 : -1;
        this.y = wFwd.angleTo(charFwd) * sign;
    }

    isMultiplayer(): boolean {
        return this.playerState != null && this.context.connection.isInRoom;
    }

    // returns true if this script doesn't have PlayerState component next to it
    isLocalPlayer(): boolean {
        const isLocal = this.playerState != null && this.playerState!.isLocalPlayer;
        return isLocal || !this.isMultiplayer();
    }

    setCharacter(enabled: boolean): void {
        if(this.controller) {
            this.controller.enabled = enabled;
            this.controller.rigidbody.isKinematic = !enabled;
        };
        this.enabled = enabled;
         
        // Dirty way of getting a camera, it is recommened to use a reference rather then searching for the component.
        // Here, it is left out for simplicity.
        const cam = this.gameObject.getComponentInChildren(Camera);
        if(cam) {
            cam.enabled = enabled;
        }
    }

    onBeforeRender() {       
        if(!this.isInitialized) return;

        // Lock the pointer on desktop if it isn't already locked
        if (this.enableDesktopInput && !PointerLock.IsLocked && this.context.input.mouseDown && !this.isMobile) {
            this.lock.lock();
        }
        
        // Gather built-in input if enabled
        if (this.enableTouchInput && this.isMobile) {
            this.gatherMobileInput();
        }

        if(this.enableDesktopInput && PointerLock.IsLocked) {
            this.gatherDesktopInput();
        }

        if(this.enableGamepadInput) {
            this.gatherGamepadInput();
        }

        this.handleMove(this.moveInput, this.jumpInput, this.sprintInput, () => this.jumpInput = false);
        this.handleLookVec(this.lookInput);

        // reset input
        this.moveInput.set(0,0);
        this.lookInput.set(0,0);
        this.sprintInput = false;
    }

    gatherMobileInput() {
        const delta = this.context.input.getPointerPositionDelta(0);
        if (delta)
            this.lookInput.copy(delta);
    }

    gatherDesktopInput() {
        const input = this.context.input;

        if (input.isKeyPressed("s") || input.isKeyPressed("DownArrow"))
            this.moveInput.y += -1;
        else if (input.isKeyPressed("w") || input.isKeyPressed("UpArrow")) 
            this.moveInput.y += 1;
        if (input.isKeyPressed("d") || input.isKeyPressed("RightArrow")) 
            this.moveInput.x += 1;
        else if (input.isKeyPressed("a") || input.isKeyPressed("LeftArrow")) 
            this.moveInput.x += -1;

        // get jump, if true keep it true
        if(input.isKeyDown(" "))
            this.jumpInput ||= true;
        else if(input.isKeyUp(" "))
            this.jumpInput = false; 
        this.sprintInput ||= input.isKeyPressed("Shift");
    }

    gatherGamepadInput() { 
        if (this.gamepadIndex === null) {
            return;
        }
        const gamepad = navigator.getGamepads()[this.gamepadIndex];

        if (!gamepad) {
            return;
        }

        const sanitize = this.sanitzeGamepadAxis.bind(this); // sanitize helper method

        // TODO: lacking acceleration for look input
        if(gamepad.axes.length >= 2) { 
            this.lookInput.x += sanitize(gamepad.axes[0]) * this.gamepadLookSensitivity;
            this.lookInput.y += sanitize(gamepad.axes[1]) * this.gamepadLookSensitivity;
        }

        if(gamepad.axes.length >= 4) { 
            this.moveInput.x += sanitize(gamepad.axes[2]);
            this.moveInput.y += sanitize(-gamepad.axes[3]);
        }
        
        // (DualShock 4)
        // X, R3, R1, R2
        this.jumpInput ||= this.getGamepadButtons(gamepad, [0, 4, 5, 6]);
        // L1, L2
        this.sprintInput ||= this.getGamepadButtons(gamepad, [7, 11]);
    }

    getGamepadButtons(gamepad: Gamepad, indexes: number[]): boolean {
        let result = false;

        indexes.forEach(index => {
            result = result || gamepad.buttons[index]?.pressed || false;
        });
        
        return result;
    }

    sanitzeGamepadAxis(input: number): number {
        if(input == null)
            return 0;

        if(input >= -this.gamepadDeadzone && input <= this.gamepadDeadzone)
            input = 0;

        return input;
    }

    protected onPointerMove = (ptr: PointerEvent) => {
        if (ptr instanceof MouseEvent) {
            if (!PointerLock.IsLocked || this.isMobile || !this.enabled)
                return;

            // immediately apply input otherwise it gets lost / delayed
            this.handleLookNum(ptr.movementX, ptr.movementY);
        }
    }

    move(input: Vector2) {
        this.moveInput = input;
    }

    jump() {
        this.jumpInput = true;
    }

    sprint(state: boolean) {
        this.sprintInput = state;
    }

    /**
     * Input: delta mouse position
    */ 
    look(input: Vector2) {
        this.lookInput.copy(input);
    }

    // apply movement to the targets
    protected handleLookVec(look: Vector2) { 
        this.handleLookNum(look.x, look.y);
    }

    private upVector = new Vector3(0, 1, 0);
    protected handleLookNum(lookX: number, lookY: number) {
        const x = -lookY / this.context.domHeight * this.lookSensitivity;
        const y = -lookX / this.context.domWidth * this.lookSensitivity;

        // add deltas to the state while clamping up-down rotation
        this.x = MathUtils.clamp(this.x + x, Mathf.toRadians(this.xRotClamp.x), Mathf.toRadians(this.xRotClamp.y));
        this.y += y;

        this.yRotTarget?.setRotationFromAxisAngle(this.upVector, this.y);
        
        // setting the eulers directly since we want to keep a 180 rot on Y axis.
        // setting the rotation via fromAxisAngle results in 0 rot on Y axis.
        // CATION: can cause gimbal lock
        if(this.xRotTarget) {
            this.xRotTarget.rotation.x = -this.x + Math.PI;
        }
    }

    // temp vectors to prevent extra alocations
    private moveDir = new Vector3();
    private fwdDir = new Vector3();
    private upDir = new Vector3(0,1,0);
    private rightDir = new Vector3();
    private jumpVec = new Vector3();
    private zeroValue = new Vector3();

    // Apply movemnt and jump input
    protected handleMove(move: Vector2, jump: boolean, sprint: boolean, onJump?: () => void) {
        if (!this.controller || !this.rigidbody) return;

        const deltaTime = this.context.time.deltaTime;
    
        // calculate directional vectors
        this.gameObject.getWorldDirection(this.fwdDir);
        this.rightDir.crossVectors(this.upDir, this.fwdDir);

        // calculate movement direction
        this.moveDir.set(0,0,0);

        this.moveDir.add(this.fwdDir.multiplyScalar(move.y));
        this.moveDir.add(this.rightDir.multiplyScalar(-move.x));

        // clamp the vector so diagonal movement isn't faster
        this.moveDir.clampLength(0, 1);

        // apply speed and delta time so it's framerate independent
        const speed = sprint ? this.sprintSpeed: this.movementSpeed;
        this.moveDir.multiplyScalar(speed * deltaTime);

        // handle jump
        if(jump && this.controller.isGrounded) {
            const rb = this.controller.rigidbody;

            // calculate & apply impulse vector
            this.jumpVec.set(0,1,0);
            this.jumpVec.multiplyScalar(this.jumpSpeed)

            // reset Y velcoity
            const vel = this.rigidbody.getVelocity();
            vel.y = 0;
            this.rigidbody.setVelocity(vel);

            // aplly impulse
            rb.applyImpulse(this.jumpVec);

            // callback
            onJump?.();
        }

        // move the character controller
        this.rigidbody.applyImpulse(this.moveDir);

        // is there any move input
        const isMoving = move.length() > 0.01;

        // clamp max speed while not effecting Y velocity
        const vel = this.rigidbody.getVelocity();
        const origY = vel.y;

        // clamp and decay velocity
        const max = sprint ? this.maxSprintSpeed: this.maxSpeed;
        vel.y = 0;
        vel.clampLength(0, max);
        if(!isMoving) {
            vel.lerp(this.zeroValue, this.stoppingDecay * deltaTime);
        }

        // restore Y velocity
        vel.y = origY;

        // apply adjusted velocity
        this.rigidbody.setVelocity(vel);
    }
}