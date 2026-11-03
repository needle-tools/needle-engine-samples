// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class BalanceScale : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The beam, turning about its local Z axis.")]
		public UnityEngine.Transform @beam;
		[UnityEngine.Tooltip("The pan on the left, seen from the front.")]
		public Needle.Engine.Components.DragTarget @leftPan;
		[UnityEngine.Tooltip("The pan on the right, seen from the front.")]
		public Needle.Engine.Components.DragTarget @rightPan;
		[UnityEngine.Tooltip("The beam turns at most this far, in degrees.")]
		public float @maxAngle = 14f;
		[UnityEngine.Tooltip("A difference of this many grams turns the beam most of the way to maxAngle.")]
		public float @sensitivity = 250f;
		[UnityEngine.Tooltip("How hard the beam is pulled towards its angle. Higher swings faster.")]
		public float @stiffness = 40f;
		[UnityEngine.Tooltip("How quickly the swing dies down. Lower wobbles longer.")]
		public float @damping = 4f;
		public void Start() {}
		public float weigh(Needle.Engine.Components.DragTarget @pan) { return default; }
		public void Update() {}
	}
}

// NEEDLE_CODEGEN_END