// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class SurfaceNormalFilter : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The DragControls this filters. Found on this object automatically if left unassigned.")]
		public Needle.Engine.Components.DragControls @dragControls;
		[UnityEngine.Tooltip("Allow the object to rest on up-facing surfaces, like a floor or a tabletop.")]
		public bool @allowFloor = true;
		[UnityEngine.Tooltip("How far a surface may tilt from straight up and still count as floor, in degrees.")]
		public float @floorAngle = 45f;
		[UnityEngine.Tooltip("Allow the object to rest on roughly vertical surfaces, like a wall. Off by default, which with the floor left on is the common case - furniture that stays on the ground instead of climbing the walls. Leave every family switched on and nothing is ever refused.")]
		public bool @allowWall = false;
		[UnityEngine.Tooltip("How far either side of exactly vertical a surface may sit and still count as a wall, in degrees.")]
		public float @wallAngle = 45f;
		[UnityEngine.Tooltip("Allow the object to rest on down-facing surfaces, like a ceiling or the underside of a shelf.")]
		public bool @allowRoof = false;
		[UnityEngine.Tooltip("How far a surface may tilt from straight down and still count as roof, in degrees.")]
		public float @roofAngle = 45f;
		[UnityEngine.Tooltip("Keep the object standing upright while it is dragged: its own up axis is held on world up, so it never tips to lie flat against a wall or hang off a ceiling, and an object picked up already leaning stands itself up. Only the tilt is taken away - whichever way the object was turned, it stays turned that way. Best paired with the DragControls option Align To Surface Normal switched off, since that one is the opposite instruction.")]
		public bool @keepUpright = false;
		[UnityEngine.Tooltip("Tint the object while it is being dragged, to show in advance what letting go would do. Needs a renderer, and leaves the object alone the rest of the time.")]
		public bool @tintWhileDragging = true;
		[UnityEngine.Tooltip("The renderer to tint. Found on this object automatically if left unassigned.")]
		public UnityEngine.Renderer @tintRenderer;
		[UnityEngine.Tooltip("Emissive tint while letting go would leave the object where it is.")]
		public UnityEngine.Color @allowedColor = new UnityEngine.Color(0f, 1f, 0f);
		[UnityEngine.Tooltip("Emissive tint while letting go would send it back to where the drag began.")]
		public UnityEngine.Color @refusedColor = new UnityEngine.Color(1f, 0f, 0f);
		[UnityEngine.Tooltip("How strongly the tint glows. 0 switches the tint off as surely as the toggle does.")]
		public float @tintIntensity = 1f;
		public void OnEnable() {}
		public void OnDisable() {}
	}
}

// NEEDLE_CODEGEN_END