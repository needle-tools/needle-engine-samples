// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class MobileControls : UnityEngine.MonoBehaviour
	{
		public bool @onlyMobile = true;
		public float @movementSensitivity = 1f;
		public float @lookSensitivity = 5f;
		public float @maxDoubleTapDelay = 200f;
		public void awake(){}
		public void OnEnable(){}
		public void OnDisable(){}
		public void update(){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
	public partial class MobileControls : UnityEngine.MonoBehaviour
	{
		public UnityEngine.Events.UnityEvent @onJump;
        public UnityEngine.Events.UnityEvent<UnityEngine.Vector2> @onLook;
        public UnityEngine.Events.UnityEvent<UnityEngine.Vector2> @onMove;
	}
}