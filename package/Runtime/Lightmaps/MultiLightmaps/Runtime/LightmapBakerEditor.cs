#if UNITY_EDITOR
using System;
using UnityEditor;
using UnityEngine;

namespace Needle.MultiLightmaps
{
	[CustomEditor(typeof(LightmapBaker))]
	public class LightmapBakerEditor : Editor
	{
		public override void OnInspectorGUI()
		{
			base.OnInspectorGUI();
			var baker = target as LightmapBaker;
			if (!baker) return;
			if (GUILayout.Button("Bake All", GUILayout.Height(50)))
			{
				baker.Bake();
			}
			EditorGUILayout.LabelField("Toggle Configurations", EditorStyles.boldLabel);
			for (var index = 0; index < baker.Configurations.Count; index++)
			{
				var config = baker.Configurations[index];
				using (new GUILayout.HorizontalScope())
				{
					var label = config.Name;
					if(baker.currentlyBaking == config) label += " (Baking)";
					EditorGUILayout.LabelField(label);
					if (GUILayout.Button("Enable Objects")) config.Enable(baker.Configurations);
					if (GUILayout.Button("Bake")) baker.Bake(index);
				}
			}
			if (!string.IsNullOrEmpty(baker.currentlyBaking?.Name))
			{
				EditorGUILayout.LabelField("Currently baking: " + baker.currentlyBaking.Name, EditorStyles.largeLabel);
			}
			// var lastRect = GUILayoutUtility.GetLastRect();
			// const int width = 100;
			// const int height = 100;
			// const int spacing = 5;
			// var x = width + spacing;
			// var y = lastRect.y + lastRect.height + 10;
			// for (var index = 0; index < baker.Configurations.Count; index++)
			// {
			// 	var config = baker.Configurations[index];
			// 	var yOff = 0;
			// 	if (baker.Lightmaps.Count > index)
			// 	{
			// 		var tex = baker.Lightmaps[index];
			// 		// EditorGUILayout.RectField(new GUIContent(tex), new Rect(x, y, width, height));
			// 		GUI.DrawTexture(new Rect(10, y, width, height), tex);
			// 		yOff = height + spacing;
			// 	}
			// 	var lh = EditorGUIUtility.singleLineHeight;
			// 	var rect = new Rect(x + 10, y, Screen.width - x - 15, lh);
			// 	GUI.Label(rect, config.Name, EditorStyles.boldLabel);
			// 	rect.y += lh;
			// 	// GUI.Button(rect, "Set Active");
			// 	y += yOff;
			// 	GUILayout.Space(yOff);
			// }
		}
	}
}
#endif