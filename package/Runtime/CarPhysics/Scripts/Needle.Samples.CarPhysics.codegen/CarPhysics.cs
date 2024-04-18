// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class CarPhysics : Needle.Engine.Components.Experimental.PlayerModule
	{
		public Needle.Typescript.GeneratedComponents.CarWheel[] @wheels = new Needle.Typescript.GeneratedComponents.CarWheel[]{ };
		[UnityEngine.Tooltip("The maximum steering angle in degrees")]
		public float @maxSteer = 35f;
		public float @steerSmoothingFactor = 3f;
		public float @accelerationForce = 75f;
		public float @breakForce = 1f;
		public float @topSpeed = 20f;
		// public CarDrive @carDirve; → Could not resolve C# type
		public void onDynamicallyConstructed(){}
		public void initialize(Needle.Engine.Components.Experimental.Player @player){}
		public void steerInput(float @steerAmount){}
		public void accelerationInput(float @accelAmount){}
		public void update(){}
		public void reset(){}
	}
}

// NEEDLE_CODEGEN_END