// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Highlight : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The renderer to highlight. Found on this object automatically if left unassigned.")]
		public UnityEngine.Renderer @renderer;
		[UnityEngine.Tooltip("The that also triggers the highlight while dragging. Found on this object automatically if left unassigned; assign explicitly if it lives elsewhere, or leave both unset for a highlight that only reacts to hover.")]
		public Needle.Engine.Components.DragControls @dragControls;
		[UnityEngine.Tooltip("Emissive tint while fully highlighted.")]
		public UnityEngine.Color @highlightColor = new UnityEngine.Color(1f, 1f, 1f);
		[UnityEngine.Tooltip("Emissive intensity while fully highlighted.")]
		public float @highlightIntensity = 1f;
		[UnityEngine.Tooltip("Seconds to fade the highlight in and out, so it doesn't hard-cut on and off. 0 switches it instantly.")]
		public float @fadeSeconds = 0.1f;
		public void OnEnable() {}
		public void OnDisable() {}
		public void onPointerEnter(UnityEngine.EventSystems.PointerEventData @_event) {}
		public void onPointerExit(UnityEngine.EventSystems.PointerEventData @_event) {}
		public void Update() {}
	}
}

// NEEDLE_CODEGEN_END