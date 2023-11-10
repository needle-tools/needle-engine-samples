import { Animator, serializable } from "@needle-tools/engine";
import { CharacterModule, CharacterModuleType } from "../Framework/CharacterModule";

// TODO: REMAKE with animation component (?)
/** Drives animator based on CharacterPhysics module */
export class CommonCharacterAnimations extends CharacterModule {
    @serializable(Animator)
    animator?: Animator;

    @serializable()
    jumpName: string = "jump";

    @serializable()
    fallingName: string = "falling";

    @serializable()
    startFallName: string = "startFall";

    @serializable()
    fallAnimDelay: number = 0.2;

    @serializable()
    idleName: string = "idling";

    @serializable()
    walkName: string = "walking";

    @serializable()
    sprintName: string = "sprinting";

    @serializable()
    minIdleSpeed: number = 1;

    @serializable()
    minSprintSpeed: number = 6;

    get Type() { return CharacterModuleType.generic; }

    private hasJumped: boolean = false;
    private hasStartedFalling: boolean = false;

    private startFallTime: number = 0;
    private previousGrounded: boolean | null | undefined = undefined;
    moduleOnBeforeRender() {
        if(!this.animator) return;

        const physicsState = this.state;
        const time = this.context.time;

        // reset hasJumped
        if(physicsState.characterIsGrounded === true)
            this.hasJumped = false;

        if(this.jumpName != "" && (physicsState.characterIsJumping ?? false)) {
            this.hasJumped = true;
            this.animator.setTrigger(this.jumpName);
        }

        // idle, walk, sprint
        const speed = physicsState.characterSpeed;
        if(speed) {
            if(this.idleName != "")
                this.animator.setBool(this.idleName, speed <= this.minIdleSpeed);

            if(this.walkName != "")
                this.animator.setBool(this.walkName, speed > this.minIdleSpeed && speed <= this.minSprintSpeed);

            if(this.sprintName != "")
                this.animator.setBool(this.sprintName, speed > this.minSprintSpeed);
        }

        // has data to drive falling animations
        const hasFallingData = physicsState.characterSpeed != null && 
                               physicsState.characterVelocity != null &&
                                 physicsState.characterIsGrounded != null;

        if(hasFallingData) {
            const isFallingDown = !physicsState.characterIsGrounded;
            const isStartingToFall = this.previousGrounded === true && physicsState.characterIsGrounded === false;
            const isLanding = this.previousGrounded === false && physicsState.characterIsGrounded === true;

            if(isStartingToFall || !isFallingDown)
                this.startFallTime = time.time;

            if(this.fallingName != "")
                this.animator.setBool(this.fallingName, isFallingDown);

            const eligibleForFall = time.time - this.startFallTime > this.fallAnimDelay;
            if(this.startFallName != "" && eligibleForFall && isFallingDown && !this.hasJumped) {
                this.startFallTime = Number.MAX_SAFE_INTEGER;
                this.animator.setTrigger(this.startFallName);
            }
        }
        
        // cache the previously grounded result to calculate start fall trigger
        this.previousGrounded = physicsState.characterIsGrounded;
    }
}