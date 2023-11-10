// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class DesktopCharacterInput : Needle.Typescript.GeneratedComponents.CharacterModule
	{
		public bool @lockCursor = true;
		public bool @rawMouseWhileLocked = true;
		public string[] @moveLeftKeys = new string[]{ "a", "ArrowLeft" };
		public string[] @moveRightKeys = new string[]{ "d", "ArrowRight" };
		public string[] @moveForwardKeys = new string[]{ "w", "ArrowUp" };
		public string[] @moveBackwardKeys = new string[]{ "s", "ArrowDown" };
		public string[] @jumpKeys = new string[]{ "Space" };
		public string[] @sprintKeys = new string[]{ "Shift" };
		public float @dragOrLockPointerId = 0f;
		public void initialize(Needle.Typescript.GeneratedComponents.Character @character){}
		public void onDestroy(){}
		public void moduleEarlyUpdate(){}
	}
}

// NEEDLE_CODEGEN_END