// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Joystick : UnityEngine.MonoBehaviour
	{
		public float @movementSensitivity = 1f;
		public float @lookSensitivity = 5f;
		public float @maxDoubleTapDelay = 200f;
		public float @size = 120f;
		public void OnEnable(){}
		public void OnDisable(){}
		public void update(){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Joystick : UnityEngine.MonoBehaviour
	{
        //public UnityEngine.Events.UnityEvent<UnityEngine.Vector2, UnityEngine.Vector2> @onValueChange = new UnityEngine.Events.UnityEvent<UnityEngine.Vector2, UnityEngine.Vector2>();

		public UnityEngine.Color @color = new UnityEngine.Color(1, 1, 1, .5f);

        [UnityEngine.TextArea]
		public string @containerCss = @"position: absolute;
bottom: 0;
left: 0;
width:  200px;
height: 200px;
user-select: none;
-webkit-user-select: none;
-webkit-touch-callout: none;";
    }
}