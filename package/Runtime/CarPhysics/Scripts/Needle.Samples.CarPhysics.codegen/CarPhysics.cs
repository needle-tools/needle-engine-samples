
namespace Needle.Typescript.GeneratedComponents
{
    public enum CarDrive { all = 0, rear = 1, front = 2 }
    public enum CarAxle { front = 1, rear = 2 }
}

// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class CarPhysics : UnityEngine.MonoBehaviour
	{
		public Needle.Typescript.GeneratedComponents.CarDrive @carDrive;
		[UnityEngine.Tooltip("The maximum steering angle in degrees")]
		public float @maxSteer = 45f;
		public float @steerSmoothingFactor = 0.5f;
		public float @accelerationForce = 3f;
		public float @breakForce = 1f;
		public float @topSpeed = 15f;
		public Needle.Typescript.GeneratedComponents.CarWheel[] @wheels = new Needle.Typescript.GeneratedComponents.CarWheel[]{ };
		public void steerInput(float @steerAmount){}
		public void accelerationInput(float @accelAmount){}
		public void awake(){}
		public void OnEnable(){}
		public void OnDisable(){}
		public void onBeforeRender(){}
	}
}

// NEEDLE_CODEGEN_END
