import { Animator, Behaviour, GameObject, serializable } from "@needle-tools/engine";
import { PlayerState } from "@needle-tools/engine";
import { syncField } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class SyncedAnimator extends Behaviour {

    @syncField()
    private running: boolean = false;

    @syncField()
    private jumping: boolean = false;

    private animator: Animator | null = null;

    onEnable(): void {
        this.animator = this.gameObject.getComponent(Animator);
    }

    update(): void {
        if (!this.animator) return;

        // TODO this seems to fail after intstantiating a prefab
        if (PlayerState.isLocalPlayer(this)) {
            // send
            const current = this.animator.getBool("running");
            if (current !== this.running) this.running = current;
            const currentJump = this.animator.getBool("jumping");
            if (currentJump !== this.jumping) this.jumping = currentJump;
        }
        else {
            // receive - could also be with callbacks
            const current = this.animator.getBool("running");
            if (current !== this.running) this.animator.setBool("running", this.running);
            const currentJump = this.animator.getBool("jumping");
            if (currentJump !== this.jumping) this.animator.setBool("jumping", this.jumping);
        }
    }
}
