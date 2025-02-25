// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class CarWheel : UnityEngine.MonoBehaviour
	{
		public UnityEngine.GameObject @wheelModel;
		public Needle.Typescript.GeneratedComponents.CarAxle @axle;
		public float @radius;
		public float @suspensionRestLength;
		public float @maxSuspensionTravel;
		public float @suspensionCompression = 2f;
		public float @suspensionRelax = 3f;
		public float @suspensionStiff = 50f;
		public float @maxSuspensionForce = 1000f;
		public float @sideFrictionStiffness = 0.5f;
		public UnityEngine.Vector2 @frictionSlip = new UnityEngine.Vector2(2f, 50f);
		public UnityEngine.ParticleSystem @skidParticle;
		public float @skidVisualSideThreshold = 5f;
		public float @skidVisualBreakThreshold = 0.1f;
		public void initialize(Needle.Typescript.GeneratedComponents.CarPhysics @car, object @vehicle, float @i){}
		public void applyPhysics(float @acceleration, float @breaking, float @steeringRad){}
		public void updateVisuals(){}
	}
}

// NEEDLE_CODEGEN_END