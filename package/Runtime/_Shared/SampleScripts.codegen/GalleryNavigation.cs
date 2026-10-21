// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class GalleryNavigation : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("Manager whose POIs are navigated. Falls back to the first one in the scene.")]
		public Needle.Typescript.GeneratedComponents.GalleryManager @manager;
		[UnityEngine.Tooltip("Colors of the number badge, picked by POI index. Leave empty for a neutral badge.")]
		public UnityEngine.Color[] @accentColors;
		[UnityEngine.Tooltip("Show the description panel right away.")]
		public bool @startExpanded = false;
		public void Awake() {}
		public void OnEnable() {}
		public void OnDisable() {}
		public void setExpanded(bool @expanded) {}
	}
}

// NEEDLE_CODEGEN_END