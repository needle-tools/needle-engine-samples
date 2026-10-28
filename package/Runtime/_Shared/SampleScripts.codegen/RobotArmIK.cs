// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class RobotArmIK : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The joints from the base outwards, each a HingeRotate DragControls.")]
		public Needle.Engine.Components.DragControls[] @joints;
		[UnityEngine.Tooltip("The point that reaches for the target, usually the tool tip. Put it under the last joint.")]
		public UnityEngine.Transform @tip;
		[UnityEngine.Tooltip("The handle that is dragged to move the tip. Keep it outside the arm, and set its rotation to Free to aim the tool in XR.")]
		public Needle.Engine.Components.DragControls @target;
		[UnityEngine.Tooltip("0 only brings the tip to the target. 1 also turns the tool to match the target's orientation.")]
		public float @orientationWeight = 0.5f;
		[UnityEngine.Tooltip("Fastest a joint turns while reaching, in degrees per second.")]
		public float @maxJointSpeed = 120f;
		[UnityEngine.Tooltip("Solver steps per frame.")]
		public float @iterations = 8f;
		[UnityEngine.Tooltip("Higher is steadier near full reach and around singular poses, lower reaches more precisely.")]
		public float @damping = 0.08f;
		public void Start() {}
		public void OnDestroy() {}
		public void Update() {}
		public float solve(UnityEngine.Vector3 @goalPosition, UnityEngine.Quaternion @goalRotation, float @deltaTime) { return default; }
	}
}

// NEEDLE_CODEGEN_END