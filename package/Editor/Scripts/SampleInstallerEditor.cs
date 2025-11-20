using System;
using System.IO;
using System.Threading.Tasks;
using Needle.Engine.Samples;
using Needle.Engine.Utils;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using Object = UnityEngine.Object;

namespace Needle.Engine
{
	[CustomEditor(typeof(SampleInstaller))]
	public class SampleInstallerEditor : Editor
	{
		[InitializeOnLoadMethod]
		private static void Init()
		{
			// Listen to assembly reload to determine if unity package with sample scene got installed....
			EditorApplication.delayCall += OnDelayCall;
			EditorSceneManager.sceneOpened += OnSceneOpened;
			return;

			async void OnSceneOpened(Scene scene, OpenSceneMode mode)
			{
				await Task.Delay(1000);
				if (!OpenIfPossible(false))
				{
#if UNITY_6000_0_OR_NEWER
					var installer = Object.FindFirstObjectByType<SampleInstaller>();
#else
					var installer = Object.FindObjectOfType<SampleInstaller>();
#endif
					Install(installer);
				}
			}

			static async void OnDelayCall()
			{
				await Task.Delay(1000);
				while (EditorApplication.isCompiling || EditorApplication.isUpdating)
				{
					await Task.Delay(100);
				}
				OpenIfPossible(false);
			}
		}

		public override void OnInspectorGUI()
		{
			using (new EditorGUI.DisabledScope(true))
				base.OnInspectorGUI();

			var t = (SampleInstaller)this.target;
			GUILayout.Space(10);
			if (GUILayout.Button("Install " + t.PackageName, GUILayout.Height(32)))
			{
				Install(t);
			}
			
			if (!string.IsNullOrEmpty(t.SceneGuid))
			{
				var scene = AssetDatabase.GUIDToAssetPath(t.SceneGuid);
				if (!string.IsNullOrEmpty(scene))
				{
					if (GUILayout.Button("Open Sample"))
					{
						OpenIfPossible(true);
					}
				}
			}
		}

		private static bool OpenIfPossible(bool force)
		{
#if UNITY_6000_0_OR_NEWER
			var installer = Object.FindFirstObjectByType<SampleInstaller>();
#else
			var installer = Object.FindObjectOfType<SampleInstaller>();
#endif
			if (!installer || string.IsNullOrEmpty(installer.SceneGuid))
				return false;
			
			var scene = AssetDatabase.GUIDToAssetPath(installer.SceneGuid);
			if (!string.IsNullOrWhiteSpace(scene))
			{
				if (!force && !Path.GetFullPath(Constants.SamplesPackagePath).Contains("PackageCache"))
				{
					Debug.LogWarning(
						$"[Sample Installer] Will not open another scene because the samples package is installed locally (development mode) - otherwise the scene {scene} would be opened.",
						AssetDatabase.LoadAssetAtPath<Object>(scene));
					return true;
				}
				var currentScene = SceneManager.GetActiveScene();
				if (currentScene.path != scene && File.Exists(scene))
				{
					Debug.Log("Open sample scene: " + scene);
					try
					{
						SamplesWindow.OpenScene(scene, true);
						// TODO: set web project path in newly opened scene
					}
					catch (Exception e)
					{
						Debug.LogException(e);
					}
					return true;
				}
				else
				{
					Debug.LogWarning($"Sample scene is already open: {scene}");
				}
			}
			return false;
		}

		private static bool isInstalling = false;

		[ContextMenu(nameof(Install))]
		internal static async void Install(SampleInstaller t)
		{
			if (!t) return;
			
			if (isInstalling) return;
			isInstalling = true;
			try
			{
				var packageName = t.PackageName;
				var packageVersion = t.PackageVersion;

				if (!string.IsNullOrWhiteSpace(packageName) && !string.IsNullOrWhiteSpace(packageVersion))
				{
					Debug.Log($"Checking if package exists on npm: {packageName}@{packageVersion}", t);
					EditorGUIUtility.PingObject(t);
					if (!await NpmUtils.PackageExists(packageName, packageVersion))
					{
						Debug.LogError(
							$"Package {packageName}@{packageVersion} does not exist on npm, please check the name and version.",
							t);
					}
					else
					{
						var exp = ExportInfo.Get();
						if (exp && exp.Exists())
						{
							Debug.Log($"Add dependency to package.json: {packageName}@{packageVersion}", t);
							var projectPath = exp.GetProjectDirectory() + "/package.json";
							if (PackageUtils.TryReadDependencies(projectPath, out var deps))
							{
								deps[packageName] = packageVersion;
								if (PackageUtils.TryWriteDependencies(projectPath, deps))
								{
									Debug.Log(
										$"Added {packageName} to dependencies - now installing (please wait)...\n${exp.PackageJsonPath}",
										t);
									await Task.Delay(1000);
									var path = exp.GetProjectDirectory();
									var cmd =
										$"{NpmUtils.GetInstallCommand(exp.GetProjectDirectory())} --silent {packageName}@{packageVersion} && npm update {packageName} --silent";
									if (await ProcessHelper.RunCommand(cmd, exp.GetProjectDirectory()))
									{
										EditorGUIUtility.PingObject(t);
										Debug.Log($"Successfully installed {packageName}@{packageVersion}", t);
										ProjectBundle.Actions.RequestWebProjectScanning(path);
									}
									else
									{
										Debug.LogWarning(
											$"Failed to install {packageName}@{packageVersion} - please check the console for errors.",
											t);
									}
								}
							}
						}
						else
						{
							Debug.LogError("Missing Needle Engine component", t);
						}
					}
				}
			}
			finally
			{
				isInstalling = false;
			}
		}
	}
}