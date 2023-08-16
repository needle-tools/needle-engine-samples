// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class FirstPersonController : UnityEngine.MonoBehaviour
	{
		public UnityEngine.CharacterController @controller;
		public UnityEngine.GameObject @xRotTarget;
		public float @lookSensitivity = 1f;
		public float @movementSpeed = 50f;
		public float @sprintSpeed = 80f;
		public float @stoppingDecay = 7f;
		public float @maxSpeed = 7f;
		public float @maxSprintSpeed = 7f;
		public float @jumpSpeed = 5f;
		public UnityEngine.Vector2 @xRotClamp = new UnityEngine.Vector2(-89, 89f);
		public bool @enableTouchInput = true;
		public bool @enableDesktopInput = true;
		public bool @enableGamepadInput = true;
		public float @gamepadDeadzone = 0.25f;
		public float @gamepadLookSensitivity = 50f;
		// public PointerLock @lock; → Could not resolve C# type
		public void start(){}
		public void initialize(){}
		public void calculateYRot(){}
		public void isMultiplayer(){}
		public void isLocalPlayer(){}
		public void setCharacter(bool @enabled){}
		public void onBeforeRender(){}
		public void gatherMobileInput(){}
		public void gatherDesktopInput(){}
		public void gatherGamepadInput(){}
		public void getGamepadButtons(object @gamepad, float[] @indexes){}
		public void sanitzeGamepadAxis(float @input){}
		public void move(UnityEngine.Vector2 @input){}
		public void jump(){}
		public void sprint(bool @state){}
		public void look(UnityEngine.Vector2 @input){}
	}
}

// NEEDLE_CODEGEN_END