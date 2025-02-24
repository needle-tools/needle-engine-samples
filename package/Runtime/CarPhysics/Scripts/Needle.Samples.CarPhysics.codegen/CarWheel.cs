// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class CarWheel : UnityEngine.MonoBehaviour
	{
		public UnityEngine.GameObject @wheelModel;
		public Needle.Typescript.GeneratedComponents.CarAxle @axle;
		public float @radius = 0.25f;
		public float @suspensionRestLength;
		public float @suspensionCompression = 0.5f;
		public float @suspensionRelax = 2.5f;
		public float @suspensionStiff = 45f;
		public float @maxSuspensionForce = 1000f;
		public float @suspensionTravel = 0.1f;
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

namespace Needle.Typescript.GeneratedComponents
{
	using System;
	using UnityEngine;

	public partial class CarWheel : UnityEngine.MonoBehaviour
	{
		private void OnDrawGizmos()
		{
			var t = transform;
			var car = GetComponentInParent<CarPhysics>();

			var wheelTransform = this.wheelModel ? this.wheelModel.transform : t;
			var wheelPositionTransform = car ? car.transform : wheelTransform;

			// Draw suspension
			var up = Vector3.up;
			var rot = wheelPositionTransform.rotation;

			Gizmos.matrix = Matrix4x4.TRS(wheelTransform.position, rot, Vector3.one);

			var offset = new Vector3(0, 0, 0);

			var rest = offset; // + -up * suspensionRestLength;
			var minSuspension = rest + up * -suspensionRestLength;
			var maxSuspension = rest + up * suspensionRestLength;

			Gizmos.color = Color.green;
			var top = rest + up * radius;// + up * suspensionRestLength;
			Gizmos.DrawLine(rest, top);
			Gizmos.DrawSphere(top, .05f);

			Gizmos.color = Color.red;
			Gizmos.DrawLine(rest + new Vector3(-radius, 0, 0), rest + new Vector3(radius, 0, 0));
			// Gizmos.DrawSphere(restingSuspension + new Vector3(radius, 0, 0), .05f);

			var forwardPos = new Vector3(0, -radius, 0);
			Gizmos.color = new Color(0, .5f, 1f);
			Gizmos.DrawLine(forwardPos, forwardPos + Vector3.forward * radius * 1.1f);
			Gizmos.DrawSphere(forwardPos + Vector3.forward * radius * 1.1f, .05f);

			

			// Draw Wheel
			DrawWheel(rest, Color.white);
			// DrawWheel(minSuspension, Color.white, 0.25f);
			// DrawWheel(maxSuspension, Color.white, 0.25f);
		}

		void DrawWheel(Vector3 origin, Color color, float alpha = 1f, int segments = 32)
		{
			color.a = alpha;
			Gizmos.color = color;

			var angleStep = 2 * (float)Math.PI / segments;
			for (int i = 0; i < segments - 1; i++)
			{
				var angleFrom = angleStep * i;
				var angleTo = angleStep * (i + 1);

				var from = new Vector3(0, Mathf.Sin(angleFrom) * radius, Mathf.Cos(angleFrom) * radius);
				var to = new Vector3(0, Mathf.Sin(angleTo) * radius, Mathf.Cos(angleTo) * radius);

				Gizmos.DrawLine(origin + from, origin + to);
				
			}
		}
	}
}