// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class CassettePlayer : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("Toggle switch, stays wherever left. On/off for the whole player - every other handle is ignored while this reads below the on threshold.")]
		public Needle.Engine.Components.DragControls @powerControl;
		[UnityEngine.Tooltip("Hinge Rotation knob, stays wherever left. Its position is written to the active source's volume every frame, continuously rather than only on a press.")]
		public Needle.Engine.Components.DragControls @volumeControl;
		[UnityEngine.Tooltip("Push button, springs back on release. Each press toggles play/pause on the cassette source - radio has no play/pause, it is always playing once tuned in, so this is ignored in FM/AM.")]
		public Needle.Engine.Components.DragControls @playPauseControl;
		[UnityEngine.Tooltip("Push button, springs back on release. Each press pauses the cassette source and seeks it back to the start. Ignored in FM/AM - radio has nothing to stop.")]
		public Needle.Engine.Components.DragControls @stopControl;
		[UnityEngine.Tooltip("Push button, held rather than clicked - stays pushed in for as long as it is being dragged, springing back once let go. Seeks the cassette source backwards for exactly as long as it reads pressed in. Ignored in FM/AM - radio has no tape to seek through.")]
		public Needle.Engine.Components.DragControls @rewindControl;
		[UnityEngine.Tooltip("Push button, held rather than clicked - stays pushed in for as long as it is being dragged, springing back once let go. Seeks the cassette source forwards for exactly as long as it reads pressed in. Ignored in FM/AM - radio has no tape to seek through.")]
		public Needle.Engine.Components.DragControls @fastForwardControl;
		[UnityEngine.Tooltip("Push button, springs back on release. Each press pops the lid open and eventually hands it over - see the class summary. Has no effect while the lid is already handed over.")]
		public Needle.Engine.Components.DragControls @ejectControl;
		[UnityEngine.Tooltip("Toggle switch, stays wherever left. Picks the active source: below a third is FM, below two thirds is AM, the rest is Cassette.")]
		public Needle.Engine.Components.DragControls @modeControl;
		[UnityEngine.Tooltip("Hinge Rotation handle on the lid itself. Disabled by default and until the eject button has popped it open - only then can it be grabbed and swung by hand.")]
		public Needle.Engine.Components.DragControls @lid;
		[UnityEngine.Tooltip("Source played while the mode switch reads FM.")]
		public UnityEngine.AudioSource @fmAudioSource;
		[UnityEngine.Tooltip("Source played while the mode switch reads AM.")]
		public UnityEngine.AudioSource @amAudioSource;
		[UnityEngine.Tooltip("Source played while the mode switch reads Cassette.")]
		public UnityEngine.AudioSource @cassetteAudioSource;
		[UnityEngine.Tooltip("The DragTarget the cassette tape is dropped into. Optional - if left unset the cassette source is never gated by presence and behaves as though a tape were always loaded, and there is nothing for opening/closing to enable or disable. Disabled itself while is closed, so a tape can only be dropped in or pulled out while the lid is actually open.")]
		public Needle.Engine.Components.DragTarget @cassetteSlot;
		[UnityEngine.Tooltip("Slider position above which a switch counts as on, or a push button counts as pressed.")]
		public float @onThreshold = 0.5f;
		[UnityEngine.Tooltip("Normalized playback position moved per second while rewinding or fast-forwarding.")]
		public float @seekSpeed = 0.6f;
		[UnityEngine.Tooltip("How often, in seconds, rewinding/fast-forwarding actually applies a seek. AudioSource re-seeks a Web Audio buffer source by stopping and restarting playback - fine for an occasional jump, but writing a new position every single frame (60 times a second) thrashes that stop/restart cycle badly enough to break playback rather than scrub it. This batches the movement implies into occasional jumps instead; itself is unaffected, since each jump covers however much time has actually elapsed since the last one.")]
		public float @seekIntervalSeconds = 0.15f;
		[UnityEngine.Tooltip("Fraction of the lid's own swing it pops open to on its own, before being handed over.")]
		public float @lidPopFraction = 0.2f;
		[UnityEngine.Tooltip("Seconds the lid's pop-open animation takes.")]
		public float @lidPopSeconds = 0.35f;
		[UnityEngine.Tooltip("How far closed (in the lid's own normalized value, 0 = fully shut) counts as closed once the player is swinging it by hand - crossing this hands back and relocks it.")]
		public float @lidCloseThreshold = 0.05f;
		[UnityEngine.Tooltip("Seconds to wait, after the player lets go of the lid, before checking whether it should relock. DragControls eases a release into its final resting pose over a short settle rather than snapping straight there, so checking - or relocking, which stops this component's own update and would freeze that easing mid-motion - right on release could catch the lid still travelling and either misread it as open or lock it down before it visually arrives. This only needs to clear that settle, comfortably.")]
		public float @lidRelockDelaySeconds = 0.3f;
		public void Start() {}
		public void OnEnable() {}
		public void OnDisable() {}
		public void Update() {}
	}
}

// NEEDLE_CODEGEN_END