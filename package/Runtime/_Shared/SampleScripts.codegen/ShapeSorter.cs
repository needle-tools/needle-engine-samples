// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class ShapeSorter : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The holes in the lid, one DragTarget each, with the shape it takes in its allowed objects.")]
		public Needle.Engine.Components.DragTarget[] @holes;
		[UnityEngine.Tooltip("The lid, hinged along its local X axis.")]
		public UnityEngine.Transform @lid;
		[UnityEngine.Tooltip("How far the lid opens, in degrees.")]
		public float @lidOpenAngle = 105f;
		[UnityEngine.Tooltip("How far a posted shape sinks into the box before it disappears, in metres.")]
		public float @sinkDepth = 0.25f;
		public void Awake() {}
		public void Start() {}
		public void OnEnable() {}
		public void OnDisable() {}
	}
}

// NEEDLE_CODEGEN_END