// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class JuiceMixer : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The mixer's bowl - a mode {")]
		public Needle.Engine.Components.DragTarget @ingredients;
		[UnityEngine.Tooltip("The socket on the mixer body the lid is dropped into - the target that sits on the mixer, not any component on the lid.")]
		public Needle.Engine.Components.DragTarget @lidTarget;
		[UnityEngine.Tooltip("The mode push button that triggers mixing, read edge-triggered - see the class summary.")]
		public Needle.Engine.Components.DragControls @button;
		[UnityEngine.Tooltip("The finished glass. Hidden until a successful press; then switched on with its Y scale set once, from how full the bowl was at that moment - see the class summary.")]
		public UnityEngine.Transform @juiceObject;
		[UnityEngine.Tooltip("s Y scale for a press made with a single ingredient in the bowl.")]
		public float @minFillScale = 0.5f;
		[UnityEngine.Tooltip("s Y scale for a press made with a full bowl ( items).")]
		public float @maxFillScale = 1f;
		[UnityEngine.Tooltip("above this counts as pressed.")]
		public float @pressThreshold = 0.5f;
		[UnityEngine.Tooltip("Raised once, right after a successful press has destroyed the ingredients and switched on.")]
		public UnityEngine.Events.UnityEvent @juiceMade = new UnityEngine.Events.UnityEvent();
		public void OnEnable() {}
		public void OnDisable() {}
		public void Update() {}
	}
}

// NEEDLE_CODEGEN_END