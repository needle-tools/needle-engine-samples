// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Touchpad : UnityEngine.MonoBehaviour
	{
		public UnityEngine.RectTransform @touchArea;
		public UnityEngine.Events.UnityEvent @onClick = new UnityEngine.Events.UnityEvent();
		public float @sensitivity = 1f;
		public float @clickDeadzone = 15f;
		public void onPointerDown(UnityEngine.EventSystems.PointerEventData @args){}
		public void onPointerUp(UnityEngine.EventSystems.PointerEventData @args){}
		public void update(){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Touchpad : UnityEngine.MonoBehaviour
	{
        public UnityEngine.Events.UnityEvent<UnityEngine.Vector2> @onMove = new UnityEngine.Events.UnityEvent<UnityEngine.Vector2>();

    }
}