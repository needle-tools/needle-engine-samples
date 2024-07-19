// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class CarWheel : UnityEngine.MonoBehaviour
	{
		public UnityEngine.GameObject @wheelModel;
		public Needle.Typescript.GeneratedComponents.CarAxle @axle;
		public float @radius = 1f;
		public float @suspensionCompression = 0.82f;
		public float @suspensionRelax = 0.88f;
		public float @suspensionRestLength = 0.2f;
		public float @suspensionStiff = 5.8f;
		public float @maxSuspensionForce = 6000f;
		public float @suspensionTravel = 5f;
		public float @sideFrictionStiffness = 0.5f;
		public UnityEngine.Vector2 @frictionSlip = new UnityEngine.Vector2(2f, 10.5f);
		public UnityEngine.ParticleSystem @skidParticle;
		public float @skidVisualSideThreshold = 5f;
		public float @skidVisualBreakThreshold = 0.1f;
		public void initialize(Needle.Typescript.GeneratedComponents.CarPhysics @car, object @vehicle, float @i){}
		public void updateVisuals(){}
		public void applyPhysics(float @acceleration, float @breaking, float @steeringRad){}
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
			Color oldColor = Gizmos.color;

			// DrawSuspensiton
			var socketOrigin = transform.position;

			var restingSuspension = socketOrigin + -transform.up * suspensionRestLength;
			var minSuspension = restingSuspension + transform.up * -suspensionTravel;
			var maxSuspension = restingSuspension + transform.up * suspensionTravel;

			Gizmos.color = Color.gray;
			Gizmos.DrawLine(minSuspension, maxSuspension);
			Gizmos.color = Color.red;
			Gizmos.DrawLine(restingSuspension + transform.forward * 0.1f, restingSuspension + transform.forward * -0.1f);


			// Draw Wheel
			DrawWheel(restingSuspension, Color.blue);
			DrawWheel(minSuspension, Color.blue, alpha: 0.25f);
			DrawWheel(maxSuspension, Color.blue, alpha: 0.25f);

			Gizmos.color = oldColor;
		}

		void DrawWheel(Vector3 origin, Color color, float alpha = 1f, int segments = 32)
		{
			Color c = Gizmos.color;

			color.a = alpha;
			Gizmos.color = color;

			var rotation = transform.rotation;

			float angleStep = 2 * (float)Math.PI / segments;
			for (int i = 0; i < segments - 1; i++)
			{
				float angleFrom = angleStep * i;
				float angleTo = angleStep * (i + 1);

				var from = rotation * new Vector3(0, Mathf.Sin(angleFrom) * radius, Mathf.Cos(angleFrom) * radius);
				var to = rotation * new Vector3(0, Mathf.Sin(angleTo) * radius, Mathf.Cos(angleTo) * radius);

				Gizmos.DrawLine(origin + from, origin + to);
			}

			Gizmos.color = c;
		}
	}
}