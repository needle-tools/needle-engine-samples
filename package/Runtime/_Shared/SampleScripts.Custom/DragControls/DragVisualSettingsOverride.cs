// Hand-written - NOT auto-generated.
//
// DragVisualSettingsOverride.ts opts out of the component compiler with //@dont-generate-component,
// so this file is never touched by codegen. It lives in Needle.Typescript.GeneratedComponents under
// the same class name so the exporter matches it to the TypeScript component. Keep field names,
// types and defaults identical to DragVisualSettingsOverride.ts.

using Needle.Engine.Components;
using UnityEngine;
#if UNITY_EDITOR
using UnityEditor;
#endif

namespace Needle.Typescript.GeneratedComponents
{
	/// <summary>
	/// Sets how every Drag Controls in the scene shows what it will do: handle icons, cursor, rim zones,
	/// limit area outline, drop and swap icons and the blocker glow. Writes into DragControls.VisualSettings
	/// while enabled and puts the previous values back when disabled.
	/// </summary>
	[DisallowMultipleComponent]
	public class DragVisualSettingsOverride : MonoBehaviour
	{
		[Tooltip("Show the handle visuals at all.")]
		public bool showVisuals = true;

		[Tooltip("Show the handle icon under the pointer. Auto: every input except a mouse. Hidden while the cursor shows the gesture.")]
		public HandleDisplay showIcon = HandleDisplay.Always;

		[Tooltip("Set the mouse cursor to match the gesture. Auto: mouse only.")]
		public HandleDisplay useCursor = HandleDisplay.Auto;

		[Tooltip("Keep showing the handle while a drag is running.")]
		public bool showWhileDragging = true;

		[Tooltip("Show the drop icon while a drag is over a Drag Target that would take the object.")]
		public bool showDrop = true;

		[Tooltip("Show the swap icon over the object a drop would swap out.")]
		public bool showSwap = true;

		[Tooltip("Icon size as a fraction of the shorter screen side, at least 720 pixels.")]
		[Range(0f, 0.25f)]
		public float iconSize = 0.05f;

		[Tooltip("Icon offset from the pointer as a fraction of the shorter screen side, X right and Y up.")]
		public Vector2 screenOffset = new Vector2(0f, 0f);

		[Tooltip("Icon tint; white leaves the art unchanged.")]
		public Color color = new Color(1f, 1f, 1f);

		[Tooltip("Icon opacity.")]
		[Range(0f, 1f)]
		public float opacity = 1f;

		[Tooltip("Draw the edge and corner zones on hovered objects that rotate or scale from their rim.")]
		public bool showRim = true;

		[Tooltip("Rim color for the zones that rotate.")]
		public Color turnColor = new Color(0.749f, 0.984f, 0.31f);

		[Tooltip("Rim color for the zones that resize.")]
		public Color resizeColor = new Color(0.784f, 0.753f, 0.996f);

		[Tooltip("Line width of the rim and the limit area outline as a fraction of the shorter screen side.")]
		[Range(0f, 0.01f)]
		public float rimWidth = 0.001f;

		[Tooltip("Emissive intensity of the rim and the limit area outline. Above 1 they glow with Bloom.")]
		public float rimIntensity = 0.8f;

		[Tooltip("Strength of the glow from the rim lines into the face. 0 turns it off.")]
		[Range(0f, 2f)]
		public float rimGlow = 0.4f;

		[Tooltip("Opacity of the dark edge around the rim and limit area lines. 0 turns it off.")]
		[Range(0f, 1f)]
		public float rimOutline = 0.5f;

		[Tooltip("When the limit area of a plane-mode Drag Controls is outlined.")]
		public LimitAreaDisplay showLimitArea = LimitAreaDisplay.WhileDragging;

		[Tooltip("Outline colour of the limit area.")]
		public Color limitAreaColor = new Color(1f, 1f, 1f);

		[Tooltip("Glow the object that holds a drag back. Needs Check For Collider on the Drag Controls.")]
		public bool showBlocker = true;

		[Tooltip("Emissive tint of the blocking object, and of the limit area sides the object touches.")]
		public Color blockerColor = new Color(1f, 0f, 0.318f);

		[Tooltip("Emissive intensity of the blocking object.")]
		public float blockerIntensity = 1f;

		[Tooltip("Show the name of the blocking object in a label over the canvas.")]
		public bool showBlockerLabel = false;

		[Tooltip("Free movement. Empty uses the built-in icon.")]
		public Texture moveIcon;

		[Tooltip("Movement along one axis, drawn along X. Empty uses the built-in icon.")]
		public Texture slideIcon;

		[Tooltip("Rotation. Empty uses the built-in icon.")]
		public Texture turnIcon;

		[Tooltip("Resizing, drawn pointing up and to the right. Empty uses the built-in icon.")]
		public Texture resizeIcon;

		[Tooltip("Shown over the object a drop would swap out. Empty uses the built-in icon.")]
		public Texture swapIcon;

		[Tooltip("Shown while a drag is over a Drag Target that would take the object. Empty uses the built-in icon.")]
		public Texture dropIcon;

		[Tooltip("Shown while a drag cannot be let go where it is. Empty uses the built-in icon.")]
		public Texture forbiddenIcon;

#if UNITY_EDITOR
		[CustomEditor(typeof(DragVisualSettingsOverride))]
		private class DragVisualSettingsOverrideEditor : Editor
		{
			public override void OnInspectorGUI()
			{
				var so = serializedObject;
				so.Update();
				EditorGUILayout.HelpBox("Sets the drag handle visuals of every Drag Controls in the scene.", MessageType.None);

				Field(so, nameof(showVisuals));
				using (new EditorGUI.DisabledScope(!so.FindProperty(nameof(showVisuals)).boolValue))
					DrawSettings(so);

				so.ApplyModifiedProperties();
			}

			private static void DrawSettings(SerializedObject so)
			{
				Section("Display");
				Field(so, nameof(showIcon));
				Field(so, nameof(useCursor));
				Field(so, nameof(showWhileDragging));
				Field(so, nameof(showDrop));
				Field(so, nameof(showSwap));

				Section("Icon");
				Field(so, nameof(iconSize));
				Field(so, nameof(screenOffset));
				Field(so, nameof(color));
				Field(so, nameof(opacity));

				Section("Rim");
				var rimShown = so.FindProperty(nameof(showRim)).boolValue;
				var limitShown = so.FindProperty(nameof(showLimitArea)).intValue != (int)LimitAreaDisplay.Never;
				Field(so, nameof(showRim));
				using (new EditorGUI.DisabledScope(!rimShown))
				{
					Field(so, nameof(turnColor));
					Field(so, nameof(resizeColor));
					Field(so, nameof(rimGlow));
				}
				// Shared with the limit area outline.
				using (new EditorGUI.DisabledScope(!rimShown && !limitShown))
				{
					Field(so, nameof(rimWidth));
					Field(so, nameof(rimIntensity));
					Field(so, nameof(rimOutline));
				}

				Section("Limit Area");
				Field(so, nameof(showLimitArea));
				using (new EditorGUI.DisabledScope(!limitShown))
					Field(so, nameof(limitAreaColor));

				Section("Blocker");
				Field(so, nameof(showBlocker));
				using (new EditorGUI.DisabledScope(!so.FindProperty(nameof(showBlocker)).boolValue))
				{
					Field(so, nameof(blockerColor));
					Field(so, nameof(blockerIntensity));
					Field(so, nameof(showBlockerLabel));
				}

				Section("Icons");
				using (new EditorGUILayout.HorizontalScope())
				{
					IconSlot(so, nameof(moveIcon), "Move");
					IconSlot(so, nameof(slideIcon), "Slide");
					IconSlot(so, nameof(turnIcon), "Turn");
					IconSlot(so, nameof(resizeIcon), "Resize");
					IconSlot(so, nameof(dropIcon), "Drop");
					IconSlot(so, nameof(swapIcon), "Swap");
					IconSlot(so, nameof(forbiddenIcon), "Forbidden");
					GUILayout.FlexibleSpace();
				}
				EditorGUILayout.HelpBox("Leave a slot empty to use the built-in icon. To show no icons, set Show Icon to Never.", MessageType.Info);
			}

			private static void Section(string title)
			{
				EditorGUILayout.Space();
				EditorGUILayout.LabelField(title, EditorStyles.boldLabel);
			}

			private static void Field(SerializedObject so, string name)
			{
				EditorGUILayout.PropertyField(so.FindProperty(name));
			}

			private static void IconSlot(SerializedObject so, string name, string label)
			{
				var prop = so.FindProperty(name);
				using (new EditorGUILayout.VerticalScope(GUILayout.Width(60)))
				{
					GUILayout.Label(new GUIContent(label, prop.tooltip), EditorStyles.miniLabel, GUILayout.Width(60));
					prop.objectReferenceValue = EditorGUILayout.ObjectField(prop.objectReferenceValue, typeof(Texture), false,
						GUILayout.Width(60), GUILayout.Height(60));
				}
			}
		}
#endif
	}
}
