// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class TextPlane : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The text to show. Line breaks start a new line.")]
		public string @text = "Your text";
		[UnityEngine.Tooltip("Height of one line in world units.")]
		public float @lineHeight = 0.1f;
		[UnityEngine.Tooltip("CSS font family, for example sans-serif or monospace.")]
		public string @fontFamily = "system-ui, sans-serif";
		[UnityEngine.Tooltip("CSS font weight: 400 is regular, 700 is bold.")]
		public float @fontWeight = 600f;
		public UnityEngine.Color @color = new UnityEngine.Color(0.02f, 0.022f, 0.026f);
		[UnityEngine.Tooltip("Card colour behind the text. Only drawn when the background opacity is above 0.")]
		public UnityEngine.Color @backgroundColor = new UnityEngine.Color(1f, 1f, 1f);
		[UnityEngine.Tooltip("0 draws the text alone, 1 on a solid card.")]
		public float @backgroundOpacity = 0f;
		[UnityEngine.Tooltip("Space around the text, in lines.")]
		public float @padding = 0.35f;
		public Needle.Typescript.GeneratedComponents.TextPlaneAlign @align = Needle.Typescript.GeneratedComponents.TextPlaneAlign.Left;
		[UnityEngine.Tooltip("Ignore scene lighting, so the text reads the same in shade and light. Applies on enable.")]
		public bool @unlit = false;
		public void OnEnable() {}
		public void OnDisable() {}
		public void OnDestroy() {}
		public void Update() {}
		public void setText(string @text) {}
	}
}

// NEEDLE_CODEGEN_END