import { AudioSource, Mathf, serializable } from "@needle-tools/engine";
import { MathUtils } from "three";
import { CharacterModule, CharacterModuleType } from "../Framework/CharacterModule";
import { CharacterPhysics_Scheme } from "../Framework/CharacterState";

declare type AudioClip = string;

/** Module that plays movement audio based on the character speed and the grounded state */
export class CommonCharacterAudio extends CharacterModule {
    @serializable()
    footStepSpeed: number = 1;

    @serializable()
    landThreshold: number = 0.2;

    @serializable(URL)
    footStepClips: AudioClip[] = [];

    @serializable(URL)
    landSFX?: AudioClip;

    @serializable(URL)
    jumpSFX?: AudioClip;

    get Type() { return CharacterModuleType.generic; }

    private lastFootStep: number = 0;

    private footstepSource: AudioSource | null = null;
    private otherSource: AudioSource | null = null;

    start(): void {
        this.footstepSource = this.gameObject.addNewComponent(AudioSource);
        this.otherSource = this.gameObject.addNewComponent(AudioSource);
    }

    private airtime: number = 0;
    private groundedLastFrame: boolean | null = null;
    moduleOnBeforeRender(): void {
        if (!this.footstepSource) return;

        const physicsState = this.state as CharacterPhysics_Scheme;
        const time = this.context.time;

        if (physicsState.characterSpeed != null && physicsState.characterSpeed > 0.1) {
            const diff = time.time - this.lastFootStep;
            const delay = this.footStepSpeed / physicsState.characterSpeed;
            if (diff > delay) {
                this.lastFootStep = time.time;
                const clip = this.footStepClips[MathUtils.randInt(0, this.footStepClips.length - 1)];
                if (physicsState.characterIsGrounded === true) {
                    this.footstepSource.stop();
                    this.footstepSource.play(clip);
                }
            }
        }

        if (physicsState.characterIsJumping && this.otherSource) {
            this.otherSource.stop();
            this.otherSource.play(this.jumpSFX);
        }

        // land
        const hasLand = physicsState.characterIsGrounded === true && this.groundedLastFrame === false;
        if (hasLand && this.airtime > this.landThreshold  && this.otherSource) {
            this.otherSource.stop();
            this.otherSource.play(this.landSFX);
        }

        // reset land
        if(physicsState.characterIsGrounded === false)
            this.airtime += time.deltaTime;
        else
            this.airtime = 0;

        this.groundedLastFrame = physicsState.characterIsGrounded!;
    }
}