using Needle.Engine;

// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Hotspot : UnityEngine.MonoBehaviour
	{
		public string @titleText = "Title";
		public string @contentText = "Content";
		public float @viewAngle = 40f;
		public void start(){}
		public void destroy(){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
	// This ensures that all the characters used in Hotspot components are available for UI components at runtime.
	public partial class Hotspot : IAdditionalFontCharacters
	{
		public string GetAdditionalCharacters() => titleText + contentText;
	}
}