// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Joystick : UnityEngine.MonoBehaviour
	{
		public UnityEngine.RectTransform @touchArea;
		public UnityEngine.RectTransform @joystick;
		public float @visualSmoothing = 1f;
		public float @scale = 1f;
		public bool @invertX = false;
		public bool @invertY = false;
		public float @sensitivity = 1f;
		public float @deadzone = 0.1f;
		public bool @clampOutput = true;
		public void awake(){}
		public void update(){}
		public void onPointerDown(UnityEngine.EventSystems.PointerEventData @args){}
		public void onPointerUp(UnityEngine.EventSystems.PointerEventData @args){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Joystick : UnityEngine.MonoBehaviour
	{
        public UnityEngine.Events.UnityEvent<UnityEngine.Vector2> @onMove = new UnityEngine.Events.UnityEvent<UnityEngine.Vector2>();
    }
}