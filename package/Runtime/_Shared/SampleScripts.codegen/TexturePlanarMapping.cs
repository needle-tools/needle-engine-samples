// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class TexturePlanarMapping : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("World units covered by one full texture tile. Smaller values repeat the texture more densely. This is a world-space texel density - it is unrelated to the object's own size, which is exactly what keeps the texture looking identical across differently sized objects.")]
		public float @tileSize = 1f;
		[UnityEngine.Tooltip("Watch the object's world matrix and rewrite the texture transform whenever it changes. Turn this off to stop watching entirely and drive it yourself with { if even the per-frame matrix check is too much, since a still object already writes nothing.")]
		public bool @continuous = true;
		public void Awake() {}
		public void OnEnable() {}
		public void Update() {}
		public void apply() {}
	}
}

// NEEDLE_CODEGEN_END