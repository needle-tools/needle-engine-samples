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
		public float @suspensionCompression = 0.5f;
		public float @suspensionRelax = 2.5f;
		public float @suspensionRestLength = 0.1f;
		public float @suspensionStiff = 45f;
		public float @maxSuspensionForce = 6000f;
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

			// Draw suspension
			var up = Vector3.up;
			// center.y += radius * .5f;
			
			Gizmos.matrix = Matrix4x4.TRS(t.position, t.rotation * Quaternion.Euler(0, 90, 0), Vector3.one);

			var offset = new Vector3(0, 0, 0);

			var restingSuspension = offset;// + -up * suspensionRestLength;
			var minSuspension = restingSuspension + up * -suspensionTravel;
			var maxSuspension = restingSuspension + up * suspensionTravel;

			Gizmos.color = Color.green;
			var top = restingSuspension + up * radius;
			Gizmos.DrawLine(restingSuspension, top);
			Gizmos.DrawSphere(top, .05f);
			
			Gizmos.color = Color.blue;
			Gizmos.DrawLine(restingSuspension + new Vector3(-radius, 0, 0), restingSuspension + new Vector3(radius, 0, 0));
			Gizmos.DrawSphere(restingSuspension + new Vector3(radius, 0, 0), .05f);
			// Gizmos.DrawLine(restingSuspension + t.forward * 0.1f, restingSuspension + t.forward * -0.1f);


			// Draw Wheel
			DrawWheel(restingSuspension, Color.blue);
			DrawWheel(minSuspension, Color.blue, 0.25f);
			DrawWheel(maxSuspension, Color.blue, 0.25f);
		}

		void DrawWheel(Vector3 origin, Color color, float alpha = 1f, int segments = 32)
		{
			color.a = alpha;
			Gizmos.color = color;

			float angleStep = 2 * (float)Math.PI / segments;
			for (int i = 0; i < segments - 1; i++)
			{
				float angleFrom = angleStep * i;
				float angleTo = angleStep * (i + 1);

				var from = new Vector3(0, Mathf.Sin(angleFrom) * radius, Mathf.Cos(angleFrom) * radius);
				var to = new Vector3(0, Mathf.Sin(angleTo) * radius, Mathf.Cos(angleTo) * radius);

				Gizmos.DrawLine(origin + from, origin + to);
			}
		}
	}
}