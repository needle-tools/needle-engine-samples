// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class CarPhysics : UnityEngine.MonoBehaviour
	{
		public Needle.Typescript.GeneratedComponents.CarWheel[] @wheels = new Needle.Typescript.GeneratedComponents.CarWheel[]{ };
		[UnityEngine.Tooltip("The maximum steering angle in degrees")]
		public float @maxSteer = 35f;
		public float @steerSmoothingFactor = 3f;
		public float @accelerationForce = 75f;
		public float @breakForce = 1f;
		public float @topSpeed = 20f;
		public Needle.Typescript.GeneratedComponents.CarDrive @carDrive;
		public void OnEnable(){}
		public void OnDisable(){}
		public void start(){}
		public void steerInput(float @steerAmount){}
		public void accelerationInput(float @accelAmount){}
		public void onBeforeRender(){}
		public void physicsLoop(){}
		public void earlyUpdate(){}
		public void reset(){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
    public enum CarDrive { front, rear, all }
    public enum CarAxle { front, rear }
}