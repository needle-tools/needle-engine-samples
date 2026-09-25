// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class NumberToBoolConverter : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The incoming value must be at least this to convert to true.")]
		public float @threshold = 0.5f;
		[UnityEngine.Tooltip("Invoked with the converted bool, only when it actually changes from the previous call.")]
		public UnityEngine.Events.UnityEvent @valueChanged = new UnityEngine.Events.UnityEvent();
		[UnityEngine.Tooltip("Invoked (no payload) whenever the converted value changes to true. Bindable from the Unity Inspector.")]
		public UnityEngine.Events.UnityEvent @onTrue = new UnityEngine.Events.UnityEvent();
		[UnityEngine.Tooltip("Invoked (no payload) whenever the converted value changes to false. Bindable from the Unity Inspector.")]
		public UnityEngine.Events.UnityEvent @onFalse = new UnityEngine.Events.UnityEvent();
		public void setValue(float @value) {}
	}
}

// NEEDLE_CODEGEN_END