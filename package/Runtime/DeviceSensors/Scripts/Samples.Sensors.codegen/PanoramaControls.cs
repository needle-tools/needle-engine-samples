// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class PanoramaControls : UnityEngine.MonoBehaviour
	{
		public Needle.Typescript.GeneratedComponents.GyroscopeMode @gyroscopeMode;
		public bool @pointerInput = true;
		public float @rotateSpeed = 0.16f;
		public float @rotateSmoothing = 5f;
		public bool @enableZoom = true;
		public float @zoomMin = 40f;
		public float @zoomMax = 90f;
		public float @zoomSpeed = 0.1f;
		public float @zoomSmoothing = 5f;
		public Needle.Typescript.GeneratedComponents.AutoRotateMode @autoRotate;
		public float @autoRotateSpeed = 0.15f;
		public float @autoRotateTimeout = 3f;
		public void start(){}
		public void onDestroy(){}
		public void onBeforeRender(){}
		public void setGyroscope(bool @state){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
	public enum GyroscopeMode
	{
		Disabled = 0,
		ControlledViaButton = 1,
		Enabled
	}

    public enum AutoRotateMode
    {
        Disabled = 0,
        OnlyOnceOnStart = 1,
        Enabled = 2
    }
}