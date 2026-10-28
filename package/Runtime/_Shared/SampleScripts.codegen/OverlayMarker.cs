// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class OverlayMarker : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("The graphic to show, for example a dot.")]
		public UnityEngine.Texture @texture;
		[UnityEngine.Tooltip("Tint of the graphic.")]
		public UnityEngine.Color @color = new UnityEngine.Color(1f, 1f, 1f);
		[UnityEngine.Tooltip("How solid the marker is.")]
		public float @opacity = 1f;
		[UnityEngine.Tooltip("Height of the marker on screen, in pixels, at any distance.")]
		public float @size = 16f;
		[UnityEngine.Tooltip("Moves the marker away from the centre of the object, in screen pixels: X right, Y up.")]
		public UnityEngine.Vector2 @screenOffset = new UnityEngine.Vector2(0f, 0f);
		[UnityEngine.Tooltip("Draw the marker in front of everything. When off, objects in front can hide the marker, but not the object it marks.")]
		public bool @alwaysOnTop = true;
		[UnityEngine.Tooltip("Hide the marker while the DragControls on this object is dragged or disabled.")]
		public bool @hideWhileDragging = true;
		[UnityEngine.Tooltip("Camera distance at which the marker starts to fade out. Fading is off while fadeEnd is not larger than this.")]
		public float @fadeStart = 0f;
		[UnityEngine.Tooltip("Camera distance at which the marker is gone.")]
		public float @fadeEnd = 0f;
		[UnityEngine.Tooltip("The object to mark. Defaults to this object: the centre of its bounds, or its position when it has no meshes.")]
		public UnityEngine.Transform @target;
		public void Awake() {}
		public void OnEnable() {}
		public void OnDisable() {}
		public void OnDestroy() {}
		public void refresh() {}
		public void onBeforeRender() {}
	}
}

// NEEDLE_CODEGEN_END