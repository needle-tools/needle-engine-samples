// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class CarWheel : UnityEngine.MonoBehaviour
	{
		public Needle.Typescript.GeneratedComponents.CarAxle @axle;
		public float @radius = 1f;
		public float @suspensionCompression = 0.82f;
		public float @suspensionRelax = 0.88f;
		public float @suspensionRestLength = 0.2f;
		public float @suspensionStiff = 5.8f;
		public float @suspensionForce = 6000f;
		public float @suspensionTravel = 5f;
		public float @sideFrictionStiffness = 0.5f;
		public float @frictionSlip = 10.5f;
		public float @frictionSlipWhenBreaking = 0.5f;
		public UnityEngine.ParticleSystem @skidParticle;
		public float @skidVisualSideTreshold = 5f;
		public float @skidVisualBreakTreshold = 0.1f;
		public void initialize(Needle.Typescript.GeneratedComponents.CarPhysics @car, object @vehicle, float @i){}
		public void updateVisuals(){}
		public void applyPhysics(float @acceleration, float @breaking, float @steeringRad){}
	}
}

// NEEDLE_CODEGEN_END