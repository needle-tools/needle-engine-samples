
namespace Needle.Typescript.GeneratedComponents
{
    public enum CarDrive { all = 0, rear = 1, front = 2 }
    public enum CarAxle { front = 0, rear = 1 }
}

// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class CarPhysics : UnityEngine.MonoBehaviour
	{
		public Needle.Typescript.GeneratedComponents.CarDrive @carDrive;
		public float @mass = 150f;
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
		public void teleport(UnityEngine.Vector3 @worldPosition, UnityEngine.Quaternion @worldRotation, bool @resetVelocities){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
	using System;
	using UnityEngine;

	public partial class CarPhysics : UnityEngine.MonoBehaviour
	{
		private void OnDrawGizmos()
		{
			var t = transform;
			Gizmos.matrix = Matrix4x4.TRS(t.position, t.rotation, t.lossyScale);
			Gizmos.color = new Color(0, .5f, 1f);
			Gizmos.DrawWireCube(Vector3.zero, new Vector3(1.5f, 0f, 4f));
			var forwardPt = Vector3.forward * 2f;
			Gizmos.DrawLine(Vector3.zero, forwardPt);
			Gizmos.DrawSphere(forwardPt, .1f);
		}
	}
}