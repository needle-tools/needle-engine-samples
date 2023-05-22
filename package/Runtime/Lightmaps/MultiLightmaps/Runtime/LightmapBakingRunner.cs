#if UNITY_EDITOR

using System.IO;
using System.Threading.Tasks;
using Needle.Engine.Codegen;
using Needle.Engine.Utils;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Needle.MultiLightmaps
{
	public class LightmapBakingRunner
	{
		private bool isBaking = false;

		public async Task<Texture2D> Bake(Object caller, string name)
		{
			if (isBaking)
			{
				Debug.Log("Cancel previous bake");
				Lightmapping.Cancel();
			}
			Debug.Log("Start lightmapping: " + name);
			isBaking = true;
			Lightmapping.bakeCompleted -= OnBakeDone;
			Lightmapping.bakeCompleted += OnBakeDone;
			var prevMode = Lightmapping.giWorkflowMode;
			try
			{
				Lightmapping.giWorkflowMode = Lightmapping.GIWorkflowMode.OnDemand;
				var started = Lightmapping.BakeAsync();
				while (isBaking && started) await Task.Delay(300);
				if (!started)
				{
					Debug.LogError("Lightmapping failed");
					return null;
				}
				// TODO: multi lightmap objects dont work like that
				Debug.Log("Lightmapping done: " + name);
				var arr = LightmapSettings.lightmaps;
#pragma warning disable 0162
				for (var index = 0; index < arr.Length; index++)
#pragma warning restore 0162
				{
					var lm = arr[index];
					var color = lm.lightmapColor;
					var assetPath = AssetDatabase.GetAssetPath(color);
					// lm.lightmapColor = color;
					// arr[index] = lm;
					var copy = CopyTexture(caller, assetPath, "Lightmap-" + name);
					return copy;
				}
			}
			finally
			{
				Lightmapping.giWorkflowMode = prevMode;
			}
			return null;
		}

		private void OnBakeDone()
		{
			isBaking = false;
		}

		private static Texture2D CopyTexture(Object caller, string sourcePath, string name)
		{
			var bytes = File.ReadAllBytes(sourcePath);
			var activeScene = SceneManager.GetActiveScene();
			var sceneName = activeScene.name;
			var sceneDirectory = Path.GetDirectoryName(activeScene.path);
			var dir = $"{sceneDirectory}/{sceneName}/NeedleEngine_Lightmaps";
			Directory.CreateDirectory(dir);
			var path = $"{dir}/{name}{Path.GetExtension(sourcePath)}";
			if (File.Exists(path)) File.Delete(path);
			File.WriteAllBytes(path, bytes);
			AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
			
			// copy the lightmap meta settings but generate a new (stable) guid
			var sourceMeta = sourcePath + ".meta";
			var targetMeta = path + ".meta";
			if (File.Exists(targetMeta) && File.Exists(sourceMeta))
			{
				File.Copy(sourceMeta, targetMeta, true);
				ComponentGeneratorUtil.GenerateAndSetStableGuid(path, caller.GetId());
			}
			AssetDatabase.Refresh();
			
			return AssetDatabase.LoadAssetAtPath(path, typeof(Texture2D)) as Texture2D;
		}
	}
}

#endif