import { Behaviour, PlayableDirector, serializeable } from "@needle-tools/engine";
import { WaitForSeconds } from "@needle-tools/engine/engine/engine_coroutine";
import { Mathf } from "@needle-tools/engine/engine/engine_math";

// Documentation → https://docs.needle.tools/scripting

export class ScrollTimeline extends Behaviour {

    @serializeable(PlayableDirector)
    timeline?: PlayableDirector;

    @serializeable()
    startOffset : number;

    @serializeable()
    lerpSpeed : number = 2.5;
    
    @serializeable()
    startLerpSpeed : number = 0.5;

    private updateTimelineCoroutine : Generator<unknown>;

    onEnable() {
        this.updateTimelineCoroutine = this.updateTimeline();
        this.startCoroutine(this.updateTimelineCoroutine);
        this.context.scene.backgroundBlurriness = 1.0;
    }

    onDisable() {
        this.stopCoroutine(this.updateTimelineCoroutine);
    }

    *updateTimeline() {
        yield WaitForSeconds(1);

        this.timeline?.play();

        while (this.timeline?.time < this.startOffset)
        {
            yield;
        }

        while (this.enabled) {
            if (this.timeline) {
                if(!this.timeline.isPlaying) this.timeline.play();
                
                const length = this.timeline.duration - this.startOffset;
                const progress = window.scrollY / (document.body.scrollHeight - window.innerHeight);

                this.timeline.time = Mathf.lerp(this.timeline.time, progress * length + this.startOffset, this.context.time.deltaTime * this.lerpSpeed);
                this.timeline.play();
                console.log(progress, progress * length, this.timeline.time);
            }
            yield;
        }
    }
}