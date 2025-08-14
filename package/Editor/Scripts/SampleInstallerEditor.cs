using System;
using System.IO;
using System.Threading.Tasks;
using Needle.Engine.Problems;
using Needle.Engine.Samples;
using Needle.Engine.Utils;
using UnityEditor;
using UnityEditor.PackageManager;
using UnityEditor.SceneManagement;
using UnityEngine;
using Object = UnityEngine.Object;

namespace Needle.Engine
{
	[CustomEditor(typeof(SampleInstaller))]
	public class SampleInstallerEditor : Editor
	{
		[InitializeOnLoadMethod]
		private static void Init()
		{
			EditorApplication.delayCall += () =>
			{
				// We also listen to assembly reloads....
				if (OpenIfPossible(false))
				{
					return;
				}
			};
			
			EditorSceneManager.sceneOpened += (_, _) =>
			{
				OpenIfPossible(false);
			};
			
		}

		private static bool OpenIfPossible(bool force)
		{
			var installer = Object.FindObjectOfType<SampleInstaller>();
			if (installer && !string.IsNullOrEmpty(installer.SceneGuid))
			{
				var scene = AssetDatabase.GUIDToAssetPath(installer.SceneGuid);
				if (!string.IsNullOrWhiteSpace(scene))
				{
					if (!force && !Path.GetFullPath(Constants.SamplesPackagePath).Contains("PackageCache"))
					{
						Debug.LogWarning($"[Sample Installer] Will not open another scene because the samples package is installed locally (development mode) - otherwise the scene {scene} would be opened.", AssetDatabase.LoadAssetAtPath<Object>(scene));
						return true;
					}
					Debug.Log("Open sample scene: " + scene);
					try
					{
						SamplesWindow.OpenScene(scene);
					}
					catch (Exception e)
					{
						Debug.LogException(e);
					}
					return true;
				}
				
				Debug.LogWarning("Could not find sample scene with guid " + installer.SceneGuid);
			}
			return false;
		}

		public override void OnInspectorGUI()
		{
			using(new EditorGUI.DisabledScope(true))
				base.OnInspectorGUI();

			var t = (SampleInstaller)this.target;
			GUILayout.Space(10);
			if (GUILayout.Button("Install " + t.PackageName, GUILayout.Height(32)))
			{
				Install();
			}
		}

		[ContextMenu(nameof(Install))]
		public async void Install()
		{
			var t = (SampleInstaller)this.target;
			var packageName = t.PackageName;
			var packageVersion = t.PackageVersion;

			if (!string.IsNullOrWhiteSpace(packageName) && !string.IsNullOrWhiteSpace(packageVersion))
			{
				Debug.Log($"Checking if package exists on npm: {packageName}@{packageVersion}", this);
				if (!await NpmUtils.PackageExists(packageName, packageVersion))
				{
					Debug.LogError(
						$"Package {packageName}@{packageVersion} does not exist on npm, please check the name and version.",
						this);
				}
				else
				{
					var exp = ExportInfo.Get();
					if (exp && exp.Exists())
					{
						Debug.Log($"Add dependency to package.json: {packageName}@{packageVersion}", this);
						var projectPath = exp.GetProjectDirectory() + "/package.json";
						if (PackageUtils.TryReadDependencies(projectPath, out var deps))
						{
							deps[packageName] = packageVersion;
							if (PackageUtils.TryWriteDependencies(projectPath, deps))
							{
								Debug.Log($"Added ${packageName} to dependencies - now installing (please wait)...\n${exp.PackageJsonPath}", this);
								await Task.Delay(1000);
								var cmd =
									$"{NpmUtils.GetInstallCommand(exp.GetProjectDirectory())} --silent {packageName}@{packageVersion} && npm update {packageName} --silent";
								if (await ProcessHelper.RunCommand(cmd, exp.GetProjectDirectory()))
								{
									Debug.Log($"Successfully installed {packageName}@{packageVersion}", this);
									OpenIfPossible(true);
								}
								else
								{
									Debug.LogWarning($"Failed to install {packageName}@{packageVersion} - please check the console for errors.", this);
								}
							}
						}
					}
					else
					{
						Debug.LogError("Missing Needle Engine component", this);
					}
				}
			}
		}
	}
}