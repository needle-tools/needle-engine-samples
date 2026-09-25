// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class PointerBlocker : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("Also shield the object behind from hover, not only from presses and clicks. Worth its own switch because the EventSystem filters per event type: a blocker that only answered to presses would let pointermove through, and the object behind would go on highlighting itself and changing the cursor for a spot that cannot be pressed. Turn this off to keep that hover feedback alive while still swallowing the press.")]
		public bool @blockHover;
		[UnityEngine.Tooltip("Keep blocking, but stop drawing the mesh - for a pane whose job is only to be in the way. The mesh stays active, because an inactive one is skipped by the raycast as well as by the renderer. Instead its materials are cloned and told to write neither colour nor depth, which leaves the geometry there for the raycast and invisible to the camera. The clone is so that a material shared with other objects in the scene does not vanish along with this one.")]
		public bool @hideMesh = false;
		public void Awake() {}
		public void Start() {}
		public void onPointerDown(UnityEngine.EventSystems.PointerEventData @_args) {}
		public void onPointerUp(UnityEngine.EventSystems.PointerEventData @_args) {}
		public void onPointerClick(UnityEngine.EventSystems.PointerEventData @_args) {}
		public void onPointerEnter(UnityEngine.EventSystems.PointerEventData @_args) {}
		public void onPointerExit(UnityEngine.EventSystems.PointerEventData @_args) {}
		public void onPointerMove(UnityEngine.EventSystems.PointerEventData @_args) {}
	}
}

// NEEDLE_CODEGEN_END