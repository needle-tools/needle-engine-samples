import { Behaviour, PlayableDirector, serializable } from "@needle-tools/engine";




export class ScrollTimelineSlider extends Behaviour {

    @serializable(PlayableDirector)
    timeline?: PlayableDirector;


    private _slider: HTMLInputElement | null = null;

    onEnable(): void {
        if (!this.timeline) return;
        if (!this._slider) {
            // create the slider element
            // we could also just re-use any exist HTML element on the website.
            // the slider doesnt have to be created here nor does it has to be a child of the canvas
            // but for the sake of a simple example we create it here 
            this._slider = document.createElement("input");
            this._slider.type = "range";
            this._slider.min = "0";
            this._slider.max = this.timeline.duration.toString();
            this._slider.step = "0.0001";
            this._slider.value = this.timeline.time.toString();
            this._slider.style.cssText = `
            position: absolute;
            bottom: 8%;
            margin: 0 auto;
            width: 50%;
            left: 25%;
            `

            // connect slider to timeline
            this._slider.oninput = () => {
                this.timeline!.time = parseFloat(this._slider!.value);
                this.timeline!.evaluate();
            }
            
            // Make sure the timeline doesnt automatically play - we want to control this from the slider
            this.timeline.pause();
            this.timeline.playOnAwake = false;
        }
        this.context.domElement.appendChild(this._slider!);
    }

    onDisable(): void {
        this._slider?.remove();
    }


}