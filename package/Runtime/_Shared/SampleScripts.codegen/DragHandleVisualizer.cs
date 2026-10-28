// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class DragHandleVisualizer : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("Show the handle icon under the pointer. Auto: every input except a mouse.")]
		public Needle.Typescript.GeneratedComponents.HandleDisplay @showIcon = Needle.Typescript.GeneratedComponents.HandleDisplay.Auto;
		[UnityEngine.Tooltip("Set the mouse cursor to match the gesture. Auto: mouse only. Restored when no longer used.")]
		public Needle.Typescript.GeneratedComponents.HandleDisplay @useCursor = Needle.Typescript.GeneratedComponents.HandleDisplay.Auto;
		[UnityEngine.Tooltip("Draw the edge and corner zones on hovered objects that rotate on edge grab or scale on corner grab.")]
		public bool @showRim = true;
		[UnityEngine.Tooltip("Icon size in screen pixels; constant at any distance.")]
		public float @iconSize = 44f;
		[UnityEngine.Tooltip("Icon offset from the pointer in screen pixels, X right and Y up.")]
		public UnityEngine.Vector2 @screenOffset = new UnityEngine.Vector2(0f, 0f);
		[UnityEngine.Tooltip("Icon tint; white leaves the art unchanged.")]
		public UnityEngine.Color @color = new UnityEngine.Color(1f, 1f, 1f);
		[UnityEngine.Tooltip("Icon opacity.")]
		public float @opacity = 0.9f;
		[UnityEngine.Tooltip("Rim color for the zones that rotate.")]
		public UnityEngine.Color @turnColor = new UnityEngine.Color(1f, 0.7f, 0.25f);
		[UnityEngine.Tooltip("Rim color for the zones that resize.")]
		public UnityEngine.Color @resizeColor = new UnityEngine.Color(0.3f, 0.8f, 1f);
		[UnityEngine.Tooltip("Rim line width in screen pixels. The hovered zone is drawn at twice this.")]
		public float @rimWidth = 2.5f;
		[UnityEngine.Tooltip("Keep showing the handle while a drag is running.")]
		public bool @showWhileDragging = true;
		[UnityEngine.Tooltip("Free movement. DragHandleMove.")]
		public UnityEngine.Texture @moveIcon;
		[UnityEngine.Tooltip("Movement along one axis, drawn along X and turned onto the axis at runtime. DragHandleSlide.")]
		public UnityEngine.Texture @slideIcon;
		[UnityEngine.Tooltip("Rotation. DragHandleTurn.")]
		public UnityEngine.Texture @turnIcon;
		[UnityEngine.Tooltip("Resizing, drawn pointing up and to the right and turned onto the grabbed corner. DragHandleResize.")]
		public UnityEngine.Texture @resizeIcon;
		[UnityEngine.Tooltip("Shown while a drag cannot be let go where it is: the drop is vetoed, or there is no room. DragHandleForbidden.")]
		public UnityEngine.Texture @forbiddenIcon;
		[UnityEngine.Tooltip("Only show handles for objects under this one. Empty: the whole scene.")]
		public UnityEngine.Transform @root;
		public void OnEnable() {}
		public void OnDisable() {}
		public void OnDestroy() {}
		public void Update() {}
	}
}

// NEEDLE_CODEGEN_END