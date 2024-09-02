import { Behaviour, PlayableDirector, syncField } from '@needle-tools/engine';

export class SyncedPlayableDirector extends Behaviour {

    @syncField(SyncedPlayableDirector.prototype.onTimeChanged)
    private time: number = 0;

    private _director?: PlayableDirector;
    /**
     * This is the allowed time difference in networking. 
     * We have to factor in some delay here due to network latency
     */
    private _timeThreshold = 0.3;

    awake() {
        this._director = this.gameObject.getComponentInChildren(PlayableDirector) ?? undefined;
    }

    onAfterRender(): void {
        if (!this._director) return;
        // Copy the current playable director time to the sync field
        const dt = Math.abs(this._director.time - this.time);
        if (dt > this._timeThreshold) {
            this.time = this._director.time;
        }
    }
    /**
     * This is called whenever a sync event is received due to another remote client setting it's time field
     * We then update the local director's time to match the remote client's time
     */
    private onTimeChanged() {
        if (!this._director) return;
        const dt = Math.abs(this._director.time - this.time);
        if (dt < this._timeThreshold) {
            return;
        }
        this._director.time = this.time;
        if (!this._director.isPlaying)
            this._director.evaluate();
    }
}