// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class CharacterPhysics : Needle.Typescript.GeneratedComponents.CharacterModule
	{
		// public CharacterPhysics_MovementMode @movementMode; → Could not resolve C# type
		public UnityEngine.CharacterController @controller;
		public float @movementSpeed = 28f;
		public float @sprintModifier = 1.5f;
		public float @jumpSpeed = 10f;
		public float @extraGravityForce = 4f;
		public float @groundingForce = 6f;
		public float @groundDrag = 0.9f;
		public float @moveDrag = 5f;
		public float @airbordDrag = 0f;
		public float @idleDrag = 0f;
		public float @desiredAirbornSpeed = 5f;
		public float @airbornInputMultiplier = 1f;
		public float @turnSpeed = 20f;
		public float @frictionIdle = 50f;
		public float @frictionMove = 0.5f;
		public float @frictionAirborn = 0f;
		public float @dominanceGroup = 0f;
		public void onDynamicallyConstructed(){}
		public void initialize(Needle.Typescript.GeneratedComponents.Character @character){}
		public void onDestroy(){}
		public void moduleUpdate(){}
		public void forceSetRotation(UnityEngine.Quaternion @rotation){}
		public void handleMove(float @x, float @y, bool @jump, float @speed, object @onJump){}
	}
}

// NEEDLE_CODEGEN_END