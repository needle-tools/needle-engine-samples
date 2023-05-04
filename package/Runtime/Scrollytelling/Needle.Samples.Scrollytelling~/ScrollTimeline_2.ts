import { Behaviour, PlayableDirector, serializeable } from "@needle-tools/engine";
import { Mathf } from "@needle-tools/engine";

// Documentation → https://docs.needle.tools/scripting


// Alternative implementation of setting a timeline's time 
// without relying on any HTML elements.
// Here we directly use the mousewheel scroll and the touch delta

export class ScrollTimeline_2 extends Behaviour {

    @serializeable(PlayableDirector)
    timeline?: PlayableDirector;

    @serializeable()
    scrollSpeed: number = 0.5;

    @serializeable()
    lerpSpeed: number = 2.5;

    private targetTime: number = 0;

    start() {

        this.timeline?.pause();

        // Grab the mousewheel event
        window.addEventListener("wheel", (evt: WheelEvent) => this.updateTime(evt.deltaY));

        // Touch events are a bit more complicated
        // We need to keep track of the last touch position
        // and calculate the delta between the current and the last position
        let lastTouchPosition = -1;
        window.addEventListener("touchmove", (evt: TouchEvent) => {
            const delta = evt.touches[0].clientY - lastTouchPosition;
            // We only want to apply the delta if it's not TOO big
            // e.g. when the user is scrolling the page
            if (delta < 10) this.updateTime(-delta);
            // Update the last touch position
            lastTouchPosition = evt.touches[0].clientY;
        });
    }

    private updateTime(delta) {
        if (!this.timeline) return;
        this.targetTime += delta * 0.01 * this.scrollSpeed;
        this.targetTime = Mathf.clamp(this.targetTime, 0, this.timeline.duration);
    }

    onBeforeRender(): void {
        if (!this.timeline) return;
        this.timeline.pause();
        this.timeline.time = Mathf.lerp(this.timeline.time, this.targetTime, this.lerpSpeed * this.context.time.deltaTime);
        this.timeline.evaluate();
    }
}
