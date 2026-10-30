#if UNITY_EDITOR

using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Needle.Typescript.GeneratedComponents
{
	[CustomEditor(typeof(GalleryManager))]
	public class GalleryManagerEditor : Editor
	{
		private const int Width = 640;
		private const int Height = 360;
		// rendered at twice the size and scaled down, for antialiasing
		private const int Supersampling = 2;

		public override void OnInspectorGUI()
		{
			base.OnInspectorGUI();
			EditorGUILayout.Space();
			serializedObject.Update();
			var solid = serializedObject.FindProperty(nameof(GalleryManager.previewSolidBackground));
			EditorGUILayout.PropertyField(solid);
			using (new EditorGUI.DisabledScope(!solid.boolValue))
				EditorGUILayout.PropertyField(serializedObject.FindProperty(nameof(GalleryManager.previewBackgroundColor)));
			EditorGUILayout.PropertyField(serializedObject.FindProperty(nameof(GalleryManager.previewLayers)));
			serializedObject.ApplyModifiedProperties();
			var content = new GUIContent("Render POI Previews",
				"Renders every POI from its camera view with the main camera and assigns the images to the POI previewImage. The images are saved in a folder next to the scene.");
			if (GUILayout.Button(content))
				RenderPreviews((GalleryManager)target);
		}

		private static void RenderPreviews(GalleryManager manager)
		{
			var scenePath = manager.gameObject.scene.path;
			if (string.IsNullOrEmpty(scenePath))
			{
				Debug.LogWarning("Save the scene before rendering POI previews.", manager);
				return;
			}
			var camera = Camera.main ? Camera.main : Camera.allCameras.FirstOrDefault();
			if (!camera)
			{
				Debug.LogWarning("No camera in the scene to render POI previews with.", manager);
				return;
			}

			var pois = manager.pois.Where(p => p && p.cameraView).ToArray();
			var folder = Path.Combine(Path.GetDirectoryName(scenePath), Path.GetFileNameWithoutExtension(scenePath) + "_POIPreviews").Replace('\\', '/');
			Directory.CreateDirectory(folder);

			// only the focused POI is visible at runtime with either option
			var isolate = manager.deactivateInactivePOIs || manager.hideInactivePOIs;
			var wasActive = manager.pois.Where(p => p).Distinct().ToDictionary(p => p, p => p.gameObject.activeSelf);
			var cameraTransform = camera.transform;
			var position = cameraTransform.position;
			var rotation = cameraTransform.rotation;
			var targetTexture = camera.targetTexture;
			var clearFlags = camera.clearFlags;
			var backgroundColor = camera.backgroundColor;
			var cullingMask = camera.cullingMask;

			var rt = RenderTexture.GetTemporary(Width * Supersampling, Height * Supersampling, 24, RenderTextureFormat.ARGB32, RenderTextureReadWrite.sRGB);
			var small = RenderTexture.GetTemporary(Width, Height, 0, RenderTextureFormat.ARGB32, RenderTextureReadWrite.sRGB);
			var image = new Texture2D(Width, Height, TextureFormat.RGB24, false);
			var written = new List<(GalleryPOI poi, string path)>();
			try
			{
				camera.targetTexture = rt;
				camera.cullingMask = cullingMask & manager.previewLayers;
				if (manager.previewSolidBackground)
				{
					camera.clearFlags = CameraClearFlags.SolidColor;
					camera.backgroundColor = manager.previewBackgroundColor;
				}
				for (var i = 0; i < pois.Length; i++)
				{
					var poi = pois[i];
					EditorUtility.DisplayProgressBar("Render POI Previews", poi.title, (float)i / pois.Length);
					if (isolate)
						foreach (var other in wasActive.Keys) other.gameObject.SetActive(other == poi);

					var view = poi.cameraView.transform;
					cameraTransform.SetPositionAndRotation(view.position, view.rotation);
					camera.Render();
					Graphics.Blit(rt, small);

					var previous = RenderTexture.active;
					RenderTexture.active = small;
					image.ReadPixels(new Rect(0, 0, Width, Height), 0, 0);
					RenderTexture.active = previous;

					var path = $"{folder}/poi-preview-{FileName(poi)}.jpg";
					File.WriteAllBytes(path, image.EncodeToJPG(88));
					written.Add((poi, path));
				}
			}
			finally
			{
				camera.targetTexture = targetTexture;
				camera.clearFlags = clearFlags;
				camera.backgroundColor = backgroundColor;
				camera.cullingMask = cullingMask;
				cameraTransform.SetPositionAndRotation(position, rotation);
				camera.ResetAspect();
				foreach (var pair in wasActive) pair.Key.gameObject.SetActive(pair.Value);
				RenderTexture.ReleaseTemporary(rt);
				RenderTexture.ReleaseTemporary(small);
				DestroyImmediate(image);
				EditorUtility.ClearProgressBar();
			}

			foreach (var (poi, path) in written)
			{
				AssetDatabase.ImportAsset(path);
				if (AssetImporter.GetAtPath(path) is TextureImporter importer)
				{
					importer.mipmapEnabled = false;
					importer.npotScale = TextureImporterNPOTScale.None;
					importer.SaveAndReimport();
				}

				var serializedPoi = new SerializedObject(poi);
				serializedPoi.FindProperty("previewImage.Mode").enumValueIndex = 0;
				serializedPoi.FindProperty("previewImage.File").objectReferenceValue = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
				serializedPoi.ApplyModifiedProperties();
			}
			EditorSceneManager.MarkSceneDirty(manager.gameObject.scene);
			Debug.Log($"Rendered {written.Count} POI previews to {folder}", manager);
		}

		private static string FileName(GalleryPOI poi)
		{
			// like the slug of the poi url parameter, the files are copied flat next to the exported scene
			var name = string.IsNullOrWhiteSpace(poi.title) ? poi.name : poi.title;
			name = name.Trim().ToLowerInvariant().Replace(' ', '-');
			foreach (var c in Path.GetInvalidFileNameChars()) name = name.Replace(c, '-');
			return name;
		}
	}
}

#endif
