import { AudioSource, Behaviour, DragAxis, DragControls, DragTarget, Mathf, serializable } from "@needle-tools/engine";
import { MathUtils, Quaternion, Vector3 } from "three";

// Documentation → https://docs.needle.tools/scripting

/** Which of the three {@link AudioSource}s {@link CassettePlayer.modeControl} is currently pointing at. */
enum CassetteMode {
    FM = 0,
    AM = 1,
    Cassette = 2,
}

const LOCAL_AXES: Record<DragAxis, Vector3> = {
    [DragAxis.X]: new Vector3(1, 0, 0),
    [DragAxis.Y]: new Vector3(0, 1, 0),
    [DragAxis.Z]: new Vector3(0, 0, 1),
};

/**
 * Drives a portable radio/cassette player built from {@link DragControls} handles of two different
 * kinds.
 *
 * {@link powerControl} and {@link modeControl} are proper switches - they physically stay wherever
 * they are left, so their {@link DragControls.normalizedValue} is read live, every frame, as the
 * current state. Normalized `0`/`1` is off/on for {@link powerControl}; for {@link modeControl}, `0`
 * is FM, `0.5` is AM, `1` is Cassette. {@link volumeControl} is the same kind of thing, a `Hinge
 * Rotation` knob rather than a slider - its position is written straight to the active source's
 * volume every frame.
 *
 * {@link playPauseControl}, {@link stopControl}, {@link rewindControl}, {@link fastForwardControl}
 * and {@link ejectControl} are the other kind - physical push buttons that spring back to released
 * the moment the player lets go, same as a real deck's buttons. {@link playPauseControl},
 * {@link stopControl} and {@link ejectControl} act as click - pressed once, momentarily, to fire -
 * so reading those live would mean the action undoes itself a frame later; each is instead watched
 * for the moment it *crosses* {@link onThreshold}, a press edge-triggered exactly once per push, and
 * every state that press causes ({@link isPlaying}, the lid) is kept here rather than read back off
 * the button, which has already sprung back out by the next frame. {@link rewindControl} and
 * {@link fastForwardControl} are different: held rather than clicked, they stay pushed in for as
 * long as the player is actively dragging them there and only spring back once let go, so those two
 * are read live every frame instead - seeking for exactly as long as the slider reads pressed in,
 * stopping the instant it is released.
 *
 * FM and AM are radio, not tape: whichever of {@link fmAudioSource} / {@link amAudioSource} is
 * selected plays on its own the moment it is powered and tuned in, with no press needed -
 * {@link playPauseControl}, {@link stopControl}, {@link rewindControl} and
 * {@link fastForwardControl} all only ever act on {@link cassetteAudioSource} and are ignored in
 * either radio mode - there is no tape to seek or transport through in FM/AM.
 * {@link playPauseControl} toggles play/pause; {@link stopControl} pauses and seeks back to the
 * start; {@link rewindControl} / {@link fastForwardControl} seek for as long as they are held.
 *
 * {@link ejectControl} pops {@link lid} open by {@link lidPopFraction} of its own swing over
 * {@link lidPopSeconds}, then hands {@link lid} itself over by enabling it, so the player can swing
 * it the rest of the way open by hand. Closing it by hand back down past {@link lidCloseThreshold}
 * hands it back - {@link lid} is disabled again, right back to needing an eject press before it can
 * be grabbed at all, the same as it started.
 *
 * {@link cassetteSlot} is the {@link DragTarget} the cassette tape itself is dropped into. The
 * cassette source never starts without one occupying it - a fresh {@link playPauseControl} press
 * does nothing while it is empty - and pulling the tape back out while playing pauses it immediately,
 * the same as pressing {@link stopControl} would, minus the seek back to the start.
 */
export class CassettePlayer extends Behaviour {

    /** Toggle switch, stays wherever left. On/off for the whole player - every other handle is
     *  ignored while this reads below the on threshold. */
    @serializable(DragControls)
    powerControl?: DragControls;

    /** Hinge Rotation knob, stays wherever left. Its position is written to the active source's
     *  volume every frame, continuously rather than only on a press. */
    @serializable(DragControls)
    volumeControl?: DragControls;

    /** Push button, springs back on release. Each press toggles play/pause on the cassette source -
     *  radio has no play/pause, it is always playing once tuned in, so this is ignored in FM/AM. */
    @serializable(DragControls)
    playPauseControl?: DragControls;

    /** Push button, springs back on release. Each press pauses the cassette source and seeks it back
     *  to the start. Ignored in FM/AM - radio has nothing to stop. */
    @serializable(DragControls)
    stopControl?: DragControls;

    /** Push button, held rather than clicked - stays pushed in for as long as it is being dragged,
     *  springing back once let go. Seeks the cassette source backwards for exactly as long as it
     *  reads pressed in. Ignored in FM/AM - radio has no tape to seek through. */
    @serializable(DragControls)
    rewindControl?: DragControls;

    /** Push button, held rather than clicked - stays pushed in for as long as it is being dragged,
     *  springing back once let go. Seeks the cassette source forwards for exactly as long as it
     *  reads pressed in. Ignored in FM/AM - radio has no tape to seek through. */
    @serializable(DragControls)
    fastForwardControl?: DragControls;

    /** Push button, springs back on release. Each press pops the lid open and eventually hands it
     *  over - see the class summary. Has no effect while the lid is already handed over. */
    @serializable(DragControls)
    ejectControl?: DragControls;

    /** Toggle switch, stays wherever left. Picks the active source: below a third is FM, below two
     *  thirds is AM, the rest is Cassette. */
    @serializable(DragControls)
    modeControl?: DragControls;

    /** Hinge Rotation handle on the lid itself. Disabled by default and until the eject button has
     *  popped it open - only then can it be grabbed and swung by hand. */
    @serializable(DragControls)
    lid?: DragControls;

    /** Source played while the mode switch reads FM. */
    @serializable(AudioSource)
    fmAudioSource?: AudioSource;

    /** Source played while the mode switch reads AM. */
    @serializable(AudioSource)
    amAudioSource?: AudioSource;

    /** Source played while the mode switch reads Cassette. */
    @serializable(AudioSource)
    cassetteAudioSource?: AudioSource;

    /** The DragTarget the cassette tape is dropped into. Optional - if left unset the cassette
     *  source is never gated by presence and behaves as though a tape were always loaded. */
    @serializable(DragTarget)
    cassetteSlot?: DragTarget;

    /** Slider position above which a switch counts as on, or a push button counts as pressed. */
    @serializable()
    onThreshold: number = 0.5;

    /** Normalized playback position moved per second while rewinding or fast-forwarding. */
    @serializable()
    seekSpeed: number = 0.6;

    /** How often, in seconds, rewinding/fast-forwarding actually applies a seek. AudioSource
     *  re-seeks a Web Audio buffer source by stopping and restarting playback - fine for an
     *  occasional jump, but writing a new position every single frame (60 times a second) thrashes
     *  that stop/restart cycle badly enough to break playback rather than scrub it. This batches the
     *  movement `seekSpeed` implies into occasional jumps instead; `seekSpeed` itself is unaffected,
     *  since each jump covers however much time has actually elapsed since the last one. */
    @serializable()
    seekIntervalSeconds: number = 0.15;

    /** Fraction of the lid's own swing it pops open to on its own, before being handed over. */
    @serializable()
    lidPopFraction: number = 0.2;

    /** Seconds the lid's pop-open animation takes. */
    @serializable()
    lidPopSeconds: number = 0.35;

    /** How far closed (in the lid's own normalized value, 0 = fully shut) counts as closed once the
     *  player is swinging it by hand - crossing this hands `lid` back and relocks it. */
    @serializable()
    lidCloseThreshold: number = 0.05;

    /** Seconds to wait, after the player lets go of the lid, before checking whether it should
     *  relock. DragControls eases a release into its final resting pose over a short settle rather
     *  than snapping straight there, so checking - or relocking, which stops this component's own
     *  update and would freeze that easing mid-motion - right on release could catch the lid still
     *  travelling and either misread it as open or lock it down before it visually arrives. This
     *  only needs to clear that settle, comfortably. */
    @serializable()
    lidRelockDelaySeconds: number = 0.3;

    private _powered: boolean = false;
    private _playing: boolean = false;
    private _rewinding: boolean = false;
    private _fastForwarding: boolean = false;
    private _mode: CassetteMode = CassetteMode.FM;

    private _poppingLid: boolean = false;
    private _lidPopT: number = 0;
    private _lidRestQuaternion?: Quaternion;
    /** Counts down after a release, `-1` while not waiting - see `lidRelockDelaySeconds`. */
    private _lidRelockTimer: number = -1;

    /** Seconds accumulated since the last applied seek jump - see `seekIntervalSeconds`. */
    private _seekTimer: number = 0;

    /** Whether whichever source is currently active is meant to be playing. */
    get isPlaying(): boolean { return this._playing; }

    /** Whether the cassette source is allowed to play at all - true if `cassetteSlot` is unset, or
     *  if it is set and currently occupied. */
    get hasCassette(): boolean { return !this.cassetteSlot || this.cassetteSlot.occupants.length > 0; }

    private readonly _wasDown: Record<string, boolean> = {};
    private readonly _unsubscribe: Array<() => void> = [];

    start(): void {
        if (this.lid) {
            this._lidRestQuaternion = this.lid.gameObject.quaternion.clone();
            this.lid.enabled = false;
        }
        this._powered = (this.powerControl?.normalizedValue ?? 0) > this.onThreshold;
        this._mode = this.currentMode();
        if (this._powered) this.resumeIfShouldPlay(this._mode);
        // Read each button's starting position so a scene that happens to load with one already
        // pressed does not fire a spurious press on the very first frame.
        this._wasDown.playPause = this.isDown(this.playPauseControl);
        this._wasDown.stop = this.isDown(this.stopControl);
        this._wasDown.eject = this.isDown(this.ejectControl);
    }

    onEnable(): void {
        // Arms lidRelockDelaySeconds rather than checking straight away - see its doc comment. The
        // release settle DragControls starts internally is still in flight at this exact moment.
        const lidDragEnded = this.lid?.dragEnded.addEventListener(() => {
            this._lidRelockTimer = this.lidRelockDelaySeconds;
        });
        if (lidDragEnded) this._unsubscribe.push(lidDragEnded);

        // A fresh grab before the delay above elapses means whatever was settling is moot - the
        // player is driving the lid again, and relocking out from under that grab would yank it
        // away mid-drag.
        const lidDragStarted = this.lid?.dragStarted.addEventListener(() => {
            this._lidRelockTimer = -1;
        });
        if (lidDragStarted) this._unsubscribe.push(lidDragStarted);

        const cassetteRemoved = this.cassetteSlot?.objectRemoved.addEventListener(() => {
            this._playing = false;
            this.cassetteAudioSource?.pause();
        });
        if (cassetteRemoved) this._unsubscribe.push(cassetteRemoved);
    }

    onDisable(): void {
        for (const unsubscribe of this._unsubscribe) unsubscribe();
        this._unsubscribe.length = 0;
    }

    update(): void {
        const dt = this.context.time.deltaTime;
        this.updateLid(dt);

        const powered = (this.powerControl?.normalizedValue ?? 0) > this.onThreshold;
        if (powered !== this._powered) {
            this._powered = powered;
            if (powered) this.resumeIfShouldPlay(this.currentMode());
            else this.pauseAllSources();
        }
        if (!this._powered) return;

        const mode = this.currentMode();
        if (mode !== this._mode) {
            this.audioSourceFor(this._mode)?.pause();
            this._mode = mode;
            this.resumeIfShouldPlay(mode);
        }
        const active = this.audioSourceFor(mode);
        if (active) active.volume = this.volumeControl?.normalizedValue ?? active.volume;

        const isCassette = mode === CassetteMode.Cassette;

        if (this.pressed("playPause", this.playPauseControl) && isCassette) {
            if (this._playing) {
                this._playing = false;
                active?.pause();
            } else if (this.hasCassette) {
                this._playing = true;
                active?.play();
            }
        }

        if (this.pressed("stop", this.stopControl) && isCassette) {
            this._playing = false;
            this._rewinding = false;
            this._fastForwarding = false;
            this.cassetteAudioSource?.pause();
            if (this.cassetteAudioSource) this.cassetteAudioSource.time01 = 0;
        }

        // Unlike the other buttons, held rather than pressed-once: the slider stays pushed in for as
        // long as the pointer is actively dragging it there, and only springs back once let go - so
        // a plain live read already means "held down", with no edge-triggering needed.
        const rewinding = isCassette && this.isDown(this.rewindControl);
        const fastForwarding = isCassette && this.isDown(this.fastForwardControl);
        if (rewinding && !this._rewinding) this._seekTimer = 0;
        if (fastForwarding && !this._fastForwarding) this._seekTimer = 0;
        this._rewinding = rewinding;
        this._fastForwarding = fastForwarding;

        if (active && (this._rewinding || this._fastForwarding)) {
            this._seekTimer += dt;
            if (this._seekTimer >= this.seekIntervalSeconds) {
                const step = this.seekSpeed * this._seekTimer;
                this._seekTimer = 0;
                active.time01 = clamp01(active.time01 + (this._rewinding ? -step : step));
            }
        } else {
            this._seekTimer = 0;
        }
    }

    /** Whether `mode`'s source should be playing right now with nothing having just pressed play -
     *  radio always is once tuned in; the cassette only if it was left playing and is still loaded.
     *  Used both when power comes on and when `modeControl` switches to a source mid-playback. */
    private resumeIfShouldPlay(mode: CassetteMode): void {
        const source = this.audioSourceFor(mode);
        if (mode === CassetteMode.Cassette) {
            if (this._playing && this.hasCassette) source?.play();
        } else {
            source?.play();
        }
    }

    /** Pops the lid via a plain quaternion animation, independent of the lid's own DragControls -
     *  which cannot be driven programmatically, only by pointer drag. Stops touching the transform
     *  the moment `lid` is handed over (enabled), so it never fights a manual drag; `onEnable`'s
     *  `dragEnded` listener, via `_lidRelockTimer`, is what hands it back once the player closes it
     *  and DragControls' own release settle has had time to finish. */
    private updateLid(dt: number): void {
        if (!this.lid || !this._lidRestQuaternion) return;

        const ejectPressed = this.pressed("eject", this.ejectControl);
        if (this.lid.enabled) {
            if (this._lidRelockTimer < 0) return;
            this._lidRelockTimer -= dt;
            if (this._lidRelockTimer > 0) return;
            this._lidRelockTimer = -1;
            if (this.lid.normalizedValue <= this.lidCloseThreshold) {
                this.lid.enabled = false;
                this._poppingLid = false;
                this._lidPopT = 0;
            }
            return;
        }

        if (ejectPressed && !this._poppingLid) {
            this._poppingLid = true;
            this._lidPopT = 0;
        }
        if (!this._poppingLid) return;

        const step = this.lidPopSeconds > 0 ? dt / this.lidPopSeconds : 1;
        this._lidPopT = Mathf.moveTowards(this._lidPopT, 1, step);

        const openAngle = (this.lid.startAngle + this.lid.rangeAngle) * this.lidPopFraction * this._lidPopT;
        const rotation = new Quaternion().setFromAxisAngle(LOCAL_AXES[this.lid.axis], MathUtils.degToRad(openAngle));
        this.lid.gameObject.quaternion.copy(this._lidRestQuaternion).multiply(rotation);

        if (this._lidPopT >= 1) {
            this._poppingLid = false;
            this.lid.enabled = true;
        }
    }

    private currentMode(): CassetteMode {
        const v = this.modeControl?.normalizedValue ?? 0;
        if (v < 1 / 3) return CassetteMode.FM;
        if (v < 2 / 3) return CassetteMode.AM;
        return CassetteMode.Cassette;
    }

    private audioSourceFor(mode: CassetteMode): AudioSource | undefined {
        switch (mode) {
            case CassetteMode.FM: return this.fmAudioSource;
            case CassetteMode.AM: return this.amAudioSource;
            case CassetteMode.Cassette: return this.cassetteAudioSource;
        }
    }

    private pauseAllSources(): void {
        this.fmAudioSource?.pause();
        this.amAudioSource?.pause();
        this.cassetteAudioSource?.pause();
    }

    private isDown(control: DragControls | undefined): boolean {
        return (control?.normalizedValue ?? 0) > this.onThreshold;
    }

    /** True exactly on the frame a momentary button's value crosses `onThreshold` going up - never
     *  true again until it has dropped back down and been pushed in a second time. `key` is any
     *  stable name distinguishing this button's tracked state from the others. */
    private pressed(key: string, control: DragControls | undefined): boolean {
        const down = this.isDown(control);
        const wasDown = this._wasDown[key] ?? false;
        this._wasDown[key] = down;
        return down && !wasDown;
    }
}

function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
}
