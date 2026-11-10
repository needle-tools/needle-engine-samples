// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class DragTrackClick : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The DragControls to move. Defaults to the first one below this object.")]
		public Needle.Engine.Components.DragControls @handle;
		[UnityEngine.Tooltip("Hinge only: the direction the handle points at, in the handle's local space.")]
		public UnityEngine.Vector3 @handleDirection = new UnityEngine.Vector3(0f, 0f, 1f);
		[UnityEngine.Tooltip("Hinge only: a click on the handle itself turns it only when it is more than this many degrees from where the handle points, so a click on the needle does not nudge it.")]
		public float @handleClickAngle = 15f;
		public void onPointerClick(UnityEngine.EventSystems.PointerEventData @args) {}
	}
}

// NEEDLE_CODEGEN_END