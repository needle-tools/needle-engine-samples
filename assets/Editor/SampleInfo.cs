using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using UnityEditor;
using UnityEngine;

namespace Needle
{
	[CreateAssetMenu(menuName = "Needle Engine/Samples/Sample Info")]
	public class SampleInfo : ScriptableObject
	{
		public string DisplayName;
		public string Description;
		public Texture Thumbnail;
		public SceneAsset Scene;
		public string LiveUrl;

		public string DisplayNameOrName => !string.IsNullOrWhiteSpace(DisplayName) ? DisplayName : name;

		private void OnValidate()
		{
			if (!Scene)
			{
				var path = AssetDatabase.GetAssetPath(this);
				if (string.IsNullOrWhiteSpace(path)) return;
				var scenes = AssetDatabase.FindAssets("t:SceneAsset", new[] { Path.GetDirectoryName(path) });
				foreach (var guid in scenes)
				{
					var scene = AssetDatabase.LoadAssetAtPath<SceneAsset>(AssetDatabase.GUIDToAssetPath(guid));
					Scene = scene;
					if (scene)
						break;
				}
			}
		}

		// [ContextMenu(nameof(CaptureScene))]
		// private async void CaptureScene()
		// {
		// 	var path = AssetDatabase.GetAssetPath(this);
		// 	var assets = AssetDatabase.LoadAllAssetsAtPath(path);
		// 	var tex = assets.FirstOrDefault(t => t is RenderTexture) as RenderTexture;
		// 	var sceneCamera = SceneView.lastActiveSceneView.camera;
		// 	var exists = (bool)tex;
		// 	const int width = 512;
		// 	const int height = 256;
		// 	if (tex && (tex.height != height || tex.width != width))
		// 	{
		// 		tex.Release();
		// 		tex = null;
		// 	}
		// 	if (!tex)
		// 	{
		// 		tex = new RenderTexture(512, 256, 1);
		// 		tex.Create();
		// 	}
		// 	Thumbnail = tex;
		// 	Thumbnail.name = "Thumbnail " + name;
		// 	sceneCamera.targetTexture = tex;
		// 	sceneCamera.Render();
		// 	await Task.Delay(10);
		// 	sceneCamera.targetTexture = null;
		// 	if (!exists)
		// 	{
		// 		AssetDatabase.AddObjectToAsset(tex, path);
		// 		AssetDatabase.ImportAsset(path);
		// 	}
		// 	EditorUtility.SetDirty(tex);
		// 	AssetDatabase.Refresh();
		// }
	}
}