// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class GalleryPOI : UnityEngine.MonoBehaviour
	{
		public UnityEngine.GameObject @cameraView;
		public string @title = "";
		[UnityEngine.Tooltip("Box the camera look target is clamped to while this POI is focused (world position and scale, like OrbitControls.targetBounds). Leave empty to keep the bounds set on the OrbitControls.")]
		public UnityEngine.Transform @targetBounds;
		[UnityEngine.Tooltip("What a visitor can do here. Shown when the GalleryNavigation panel is expanded.")]
		public string @description = "";
		[UnityEngine.Tooltip("Features this POI shows off, listed as tags under the description.")]
		public string[] @features;
		public void Start() {}
		public void focus() {}
		public void focusNext() {}
		public void focusPrevious() {}
	}
}

// NEEDLE_CODEGEN_END