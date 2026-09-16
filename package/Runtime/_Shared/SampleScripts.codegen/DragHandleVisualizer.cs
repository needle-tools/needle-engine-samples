// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class DragHandleVisualizer : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("Show the handle icon in the scene, under the pointer. On Auto it appears for every input except a mouse, which is better served by the cursor below.")]
		public Needle.Typescript.GeneratedComponents.HandleDisplay @showIcon = Needle.Typescript.GeneratedComponents.HandleDisplay.Auto;
		[UnityEngine.Tooltip("Set the mouse cursor to match the gesture. On Auto it is used for mouse input only - there is no cursor to set in XR, and none worth setting on a touch screen. Restored to whatever it was as soon as the pointer leaves a draggable, on disable, and the moment Auto stops choosing it - so this never leaves a stuck cursor behind.")]
		public Needle.Typescript.GeneratedComponents.HandleDisplay @useCursor = Needle.Typescript.GeneratedComponents.HandleDisplay.Auto;
		[UnityEngine.Tooltip("How big the icon is drawn, in screen pixels. Constant at any distance: a handle is a piece of interface, and a piece of interface that shrinks into the distance stops being clickable long before it stops being drawn.")]
		public float @iconSize = 44f;
		[UnityEngine.Tooltip("Nudge the icon away from the spot it marks, in screen pixels: X to the right, Y up. Screen pixels rather than world units so the nudge holds its distance at any depth and any zoom, exactly as the icon size does. A world-space offset would drift as the camera moved and would have to be retuned for every object it was used on. Useful mainly to get the icon out from under the mouse cursor, which sits at that same spot and otherwise covers it. Something like 0, 28 puts the handle just above the pointer.")]
		public UnityEngine.Vector2 @screenOffset = new UnityEngine.Vector2(0f, 0f);
		[UnityEngine.Tooltip("Icon tint. Multiplies the assigned art, so white leaves it exactly as authored. The supplied icons have a near-black plate behind the glyph, which a tint leaves neutral.")]
		public UnityEngine.Color @color = new UnityEngine.Color(1f, 1f, 1f);
		[UnityEngine.Tooltip("How solid the icon is.")]
		public float @opacity = 0.9f;
		[UnityEngine.Tooltip("Keep showing the handle while a drag is actually running. On by default: the icon tracks the live pointer through the drag and is the clearest confirmation that the gesture the user aimed for is the one they got.")]
		public bool @showWhileDragging = true;
		[UnityEngine.Tooltip("Art for free movement, shown on the body of an object that can be carried anywhere. An open hand, DragHandleMove in the shared Icons folder.")]
		public UnityEngine.Texture @moveIcon;
		[UnityEngine.Tooltip("Art for movement along one axis, turned onto that axis at runtime. DragHandleSlide.")]
		public UnityEngine.Texture @slideIcon;
		[UnityEngine.Tooltip("Art for rotation. DragHandleTurn.")]
		public UnityEngine.Texture @turnIcon;
		[UnityEngine.Tooltip("Art for resizing, turned onto the corner being grabbed. DragHandleResize, whose arrow is drawn pointing up and to the right - see the note on the icon angle if you replace it.")]
		public UnityEngine.Texture @resizeIcon;
		[UnityEngine.Tooltip("Art shown in place of the usual handle while a drag is over a drop target that will not take it right now. DragHandleForbidden. Not turned to any angle: shown exactly as drawn.")]
		public UnityEngine.Texture @forbiddenIcon;
		[UnityEngine.Tooltip("Only show handles for objects under this one. Leave empty to watch the whole scene, which is the usual setup — set it when only part of a scene is meant to look editable.")]
		public UnityEngine.Transform @root;
		public void OnEnable() {}
		public void OnDisable() {}
		public void OnDestroy() {}
		public void Update() {}
	}
}

// NEEDLE_CODEGEN_END