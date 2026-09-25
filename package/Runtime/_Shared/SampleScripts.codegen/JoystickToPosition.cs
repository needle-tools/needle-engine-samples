// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class JoystickToPosition : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The {")]
		public Needle.Engine.Components.DragControls @joystick;
		[UnityEngine.Tooltip("Object to move. Defaults to this object.")]
		public UnityEngine.Transform @target;
		[UnityEngine.Tooltip("Which {")]
		public Needle.Typescript.GeneratedComponents.JoystickAxis @xAxis = Needle.Typescript.GeneratedComponents.JoystickAxis.X;
		[UnityEngine.Tooltip("Which {")]
		public Needle.Typescript.GeneratedComponents.JoystickAxis @yAxis = Needle.Typescript.GeneratedComponents.JoystickAxis.Z;
		[UnityEngine.Tooltip("Local X range: is written when {")]
		public UnityEngine.Vector2 @rangeX = new UnityEngine.Vector2(-1f, 1f);
		[UnityEngine.Tooltip("Local Y range: is written when {")]
		public UnityEngine.Vector2 @rangeY = new UnityEngine.Vector2(-1f, 1f);
		[UnityEngine.Tooltip("Flip {")]
		public bool @invertX = false;
		[UnityEngine.Tooltip("Flip {")]
		public bool @invertY = false;
		public void Start() {}
		public void Update() {}
	}
}

// NEEDLE_CODEGEN_END