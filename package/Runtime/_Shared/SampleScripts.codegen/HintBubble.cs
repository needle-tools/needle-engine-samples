// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class HintBubble : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("What the user can do here. Leave empty to describe the DragControls or DragTarget on this object.")]
		public string @text = "";
		[UnityEngine.Tooltip("Where the bubble sits, in screen pixels from the object: X right, Y up.")]
		public UnityEngine.Vector2 @screenOffset = new UnityEngine.Vector2(90f, 70f);
		[UnityEngine.Tooltip("Only show the hint while the camera is closer than this. 0 shows it at any distance.")]
		public float @maxDistance = 0f;
		[UnityEngine.Tooltip("Hide the hint while another object is in front of this one, for example a wall.")]
		public bool @hideWhenOccluded = true;
		[UnityEngine.Tooltip("When the hint is shown.")]
		public Needle.Typescript.GeneratedComponents.HintShowMode @showWhen = Needle.Typescript.GeneratedComponents.HintShowMode.Always;
		[UnityEngine.Tooltip("Hide the hint for good once it has been used: the object dragged, or for a DragTarget hint something dropped onto it.")]
		public bool @hideAfterDrag = true;
		[UnityEngine.Tooltip("The object the arrow points at. Defaults to this object.")]
		public UnityEngine.Transform @target;
		public void Awake() {}
		public void OnEnable() {}
		public void OnDisable() {}
		public void refresh() {}
		public void onBeforeRender() {}
	}
}

// NEEDLE_CODEGEN_END