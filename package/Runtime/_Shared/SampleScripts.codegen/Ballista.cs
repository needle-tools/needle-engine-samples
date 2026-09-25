// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Ballista : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("Where arrows are loaded. Slot 0 (or, in {")]
		public Needle.Engine.Components.DragTarget @loadTarget;
		[UnityEngine.Tooltip("The {")]
		public UnityEngine.Transform @slotTransform;
		[UnityEngine.Tooltip("The Slide-mode {")]
		public Needle.Engine.Components.DragControls @drawControls;
		[UnityEngine.Tooltip("The transform that aims the shot. Which of its local axes is used is {")]
		public UnityEngine.Transform @shootDirection;
		[UnityEngine.Tooltip("Local axis of {")]
		public UnityEngine.Vector3 @shootAxis = new UnityEngine.Vector3(0f, 0f, 1f);
		[UnityEngine.Tooltip("The arrow model's own **nose axis**, in its local space: the direction the mesh points. Defaults to +Z, matching the sample's arrows. This is the compensation for a model that isn't built facing -Z. It turns the arrow on release so its nose lands on the flight direction, rather than bending the flight direction to match the model - the impulse always follows {")]
		public UnityEngine.Vector3 @arrowForward = new UnityEngine.Vector3(0f, 0f, 1f);
		[UnityEngine.Tooltip("Impulse applied to the arrow's rigidbody at maximum draw.")]
		public float @force = 10f;
		[UnityEngine.Tooltip("Impulse applied at zero draw. A fully-loaded shot never falls below this.")]
		public float @minForce = 1f;
		[UnityEngine.Tooltip("Minimum {")]
		public float @minDrawThreshold = 0.5f;
		[UnityEngine.Tooltip("Length of the debug gizmos in world units. Only used with .")]
		public float @debugGizmoScale = 0.5f;
		public void OnEnable() {}
		public void OnDisable() {}
		public void onBeforeRender() {}
	}
}

// NEEDLE_CODEGEN_END