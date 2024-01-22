// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class NavmeshDemo_Agent : UnityEngine.MonoBehaviour
	{
		public float @speed = 0.5f;
		public float @delayBetweenRandomTargets = 1f;
		public UnityEngine.Vector2 @squareArea = new UnityEngine.Vector2(5f, 5f);
		public UnityEngine.MeshRenderer @bodyRenderer;
		public bool @moveRandomlyWhenIdle = true;
		public void awake(){}
		public void moveToRandomTarget(){}
		public void moveTo(UnityEngine.Vector3 @target, object @onArrived){}
		public void stopMoving(){}
		public void driveAlongPath(UnityEngine.Vector3[] @path, object @onArrived){}
	}
}

// NEEDLE_CODEGEN_END