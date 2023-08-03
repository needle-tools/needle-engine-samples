import { Behaviour, PlayableDirector, serializeable } from "@needle-tools/engine";
import { WaitForSeconds } from "@needle-tools/engine";
import { Mathf } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting

export class ScrollTimeline extends Behaviour {

    @serializeable(PlayableDirector)
    timeline?: PlayableDirector;

    @serializeable()
    startOffset: number = 0;

    @serializeable()
    lerpSpeed: number = 2.5;

    @serializeable()
    startLerpSpeed: number = 0.5;

    private updateTimelineCoroutine!: Generator<unknown>;

    start() {
        const mainCam = this.context.mainCameraComponent;
        if (!mainCam) return;

        const startFov = mainCam.fieldOfView!; // designed for 16:9

        // add resize observer to domElement
        const resizeObserver = new ResizeObserver(_ => {
            // approximate calculation for nicer FOV across various aspect ratios
            let fov = startFov;
            const aspect = Mathf.clamp(this.context.domWidth / this.context.domHeight / 1.77777777, 0.25, 3.5);
            fov /= Mathf.lerp(aspect, 1, 0.2);
            mainCam.fieldOfView = fov;
        });
        resizeObserver.observe(this.context.domElement);
    }

    onEnable() {
        this.updateTimelineCoroutine = this.updateTimeline();
        this.startCoroutine(this.updateTimelineCoroutine);

        //@ts-ignore
        this.context.scene.backgroundBlurriness = 1.0;
    }

    onDisable() {
        this.stopCoroutine(this.updateTimelineCoroutine);
    }

    *updateTimeline() {
        yield WaitForSeconds(1);

        if (!this.timeline) return;

        this.timeline.play();

        while (this.timeline.time < this.startOffset) {
            yield;
        }

        while (this.enabled) {
            if (this.timeline) {
                if (this.timeline.isPlaying) this.timeline.pause();

                const length = this.timeline.duration - this.startOffset;
                const progress = window.scrollY / (document.body.scrollHeight - window.innerHeight);

                this.timeline.time = Mathf.lerp(this.timeline.time, progress * length + this.startOffset, this.context.time.deltaTime * this.lerpSpeed);
                this.timeline.evaluate();
            }
            yield;
        }
    }
}
