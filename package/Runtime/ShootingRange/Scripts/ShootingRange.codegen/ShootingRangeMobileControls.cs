// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class ShootingRangeMobileControls : UnityEngine.MonoBehaviour
	{
		public bool @onlyMobile = true;
		public float @movementSensitivity = 1f;
		public float @lookSensitivity = 5f;
		public float @maxDoubleTapDelay = 200f;
		public UnityEngine.Color @moveJoyColor;
		public UnityEngine.Color @lookJoyColor;
		public UnityEngine.Events.UnityEvent @onAimEnd = new UnityEngine.Events.UnityEvent();
		public UnityEngine.Events.UnityEvent @onSingleTap = new UnityEngine.Events.UnityEvent();
		public float @maxShootDistance = 0.1f;
		public float @maxShootDuration = 0.1f;
		public void awake(){}
		public void OnEnable(){}
		public void OnDisable(){}
		public void update(){}
		public void getRGBAColorString(UnityEngine.Color @color){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
    public partial class ShootingRangeMobileControls : UnityEngine.MonoBehaviour
    {
        public UnityEngine.Events.UnityEvent @onJump;
        public UnityEngine.Events.UnityEvent<UnityEngine.Vector2> @onLook;
        public UnityEngine.Events.UnityEvent<UnityEngine.Vector2> @onMove;
    }
}