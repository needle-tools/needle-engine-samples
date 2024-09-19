using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Needle.Engine;
using Needle.Engine.Samples;
using Needle.Engine.Utils;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Editor
{
    public static class SampleComponentDependencies
    {
	    [InitializeOnLoadMethod]
	    private static void SceneListener()
	    {
		    // This will update referenced components whenever a scene is closed.
		    EditorSceneManager.sceneClosing += OnSceneClosed;
	    }
		
	    private static void OnSceneClosed(Scene scene, bool isRemovingScene)
	    {
		    // TODO this could potentially be cached, but then might be wrong once 
		    // new samples are created
		    var allSampleInfos = AssetDatabase
			    .FindAssets("t:SampleInfo")
			    .Select(AssetDatabase.GUIDToAssetPath)
			    .Select(AssetDatabase.LoadAssetAtPath<SampleInfo>);
		    
		    var sceneAsset = AssetDatabase.LoadAssetAtPath<SceneAsset>(scene.path);
		    var sampleInfosForScene = allSampleInfos.Where(x => x.Scene == sceneAsset);
		    foreach (var sampleInfo in sampleInfosForScene)
		    {
			    if (IsDebugMode) Debug.Log("Updating component dependencies for " + sampleInfo.name, sampleInfo);
			    CollectDependencies(sampleInfo);
		    }
	    }

	    private static bool IsDebugMode => false; // NeedleDebug.IsEnabled(TracingScenario.Samples);
        private static bool _dependencyCollectionIsScheduled = false;
		
		[MenuItem("CONTEXT/SampleInfo/Load Scene and collect Component Dependencies")]
		private static void ScheduleCollectDependencies(MenuCommand command)
		{
			if (_dependencyCollectionIsScheduled) return;
			_dependencyCollectionIsScheduled = true;
			EditorApplication.delayCall += () => CollectDependencies(command);
		}
		
		private static void CollectDependencies(MenuCommand command)
		{
			_dependencyCollectionIsScheduled = false;
			var sampleInfos = Selection.GetFiltered<SampleInfo>(SelectionMode.DeepAssets | SelectionMode.Editable);
			EditorSceneManager.sceneClosing -= OnSceneClosed;

			for (var i = 0; i < sampleInfos.Length; i++)
			{
				var Scene = sampleInfos[i].Scene;
				
				if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
				var isOpen = false;
				var count = SceneManager.sceneCount;
				var path = AssetDatabase.GetAssetPath(Scene);
				for (var j = 0; j < count; j++)
				{
					var scene = SceneManager.GetSceneAt(j);
					if (scene.path == path)
					{
						isOpen = true;
						break;
					}
				}
				if (!isOpen)
					EditorSceneManager.OpenScene(path, OpenSceneMode.Single);
				
				var sampleInfo = sampleInfos[i];
				if (EditorUtility.DisplayCancelableProgressBar("Updating Component Infos", sampleInfo.name, i / (float)sampleInfos.Length))
					break;
				CollectDependencies(sampleInfo);
			}
			EditorUtility.ClearProgressBar();
			EditorSceneManager.sceneClosing += OnSceneClosed;
		}

		internal static void CollectDependencies(SampleInfo sampleInfo)
		{
			// Approach: Traverse all components in the scene, collect all Object dependency properties from them,
			// and traverse those as well. This would allow us to skip specific objects (like the Default Avatar) or handle them differently.
			HashSet<Component> traversed = new HashSet<Component>();
			HashSet<Type> componentTypes = new HashSet<Type>();
			
			var guidsToSkip = new string[]
			{
				"dc55b2cca6c9bdc4187b43e34b1b51cf", // Default Avatar
				"2bcc43beb6c02634dadc7ce5aeec5544", // Default Sync Camera
			};
			
			void Traverse(GameObject root)
			{
				if (PrefabUtility.IsPartOfPrefabAsset(root))
				{
					var prefabPath = PrefabUtility.GetPrefabAssetPathOfNearestInstanceRoot(root);
					var prefabGuid = AssetDatabase.AssetPathToGUID(prefabPath);
					if (guidsToSkip.Contains(prefabGuid))
					{
						if (IsDebugMode)
							Debug.Log("Skipping known prefab " + root.name);
						return;
					}
					
					if (IsDebugMode)
					   Debug.Log("Collecting dependencies in prefab " + root.name);
				}
				foreach (var c in root.GetComponentsInChildren<Component>())
				{
					if (!traversed.Add(c)) continue;
					if (c is Transform) continue;
					if (c is MeshFilter) continue;
					componentTypes.Add(c.GetType());
					
					// Debug.Log("Traversing " + c.gameObject.name + " (" + c.GetType().Name + ")");
					var property = new SerializedObject(c).GetIterator();
					while (property.NextVisible(true)) // enterChildren = true to scan all properties
					{
						var propertyPath = property.propertyPath;
						switch (property.propertyType)
						{
							case SerializedPropertyType.Generic:
								if (propertyPath.Contains("m_PersistentCalls.m_Calls.Array.data["))
								{
									var targetProperty = property.FindPropertyRelative("m_Target");
									var methodProperty = property.FindPropertyRelative("m_MethodName");
									// TODO find method parameter objects
								}

								break;
							case SerializedPropertyType.ObjectReference:
								if (property.objectReferenceValue is Component component)
									Traverse(component.gameObject);
								else if (property.objectReferenceValue is GameObject go)
									Traverse(go);
								break;
						}
					}
				}
			}

			for (var i = 0; i < SceneManager.sceneCount; i++)
			{
				var roots = SceneManager.GetSceneAt(i).GetRootGameObjects();
				foreach (var t in roots) Traverse(t);
			}

			componentTypes = componentTypes.OrderBy(x => x.Name).ToHashSet();
			
			var exportInfo = ExportInfo.Get();
			var lastProjectDirectory = default(string);
			if (exportInfo) lastProjectDirectory = exportInfo.DirectoryName;
			
			IReadOnlyList<ImportInfo> types = default;
			if (lastProjectDirectory != null)
			{
				var projectInfo = new ProjectInfo(null);
				projectInfo.UpdateFrom(lastProjectDirectory);
				types = TypesUtils.GetTypes(projectInfo);
			}

			var dependencyPaths = componentTypes.Select(type =>
			{
				var typeName = type.Name;
				var match = types.FirstOrDefault(k =>
					string.Equals(k.TypeName, typeName, StringComparison.InvariantCultureIgnoreCase));
				if (match != null)
				{
					var path = match.FilePath;

					path = path.Replace(@"\", "/");

					// Engine scripts – relative to engine package root
					var index = path.IndexOf("engine/src/", StringComparison.OrdinalIgnoreCase);
					if (index >= 0)
						path = path.Substring(index);
					else
					{
						// Samples scripts – relative to samples repository root
						index = path.IndexOf("needle-engine-samples/package/", StringComparison.OrdinalIgnoreCase);
						if (index >= 0)
							path = path.Substring(index);
					}

					return (type, path);
				}

				// return type.FullName;
				return (type, null);
			}).Where(x => !string.IsNullOrEmpty(x.path)).Distinct().ToList();
			
			var Name = sampleInfo.Name;
			if (IsDebugMode)
			{
				Debug.Log($"<b>Component Types for {Name}</b> ({componentTypes.Count})\n{string.Join("\n", componentTypes.Select(x => x.Name))}");
				Debug.Log($"<b>Dependencies for {Name}</b> ({dependencyPaths.Count})\n{string.Join("\n", dependencyPaths)}");
			}

			if (dependencyPaths.Count < 1 && IsDebugMode)
			{
				Debug.LogWarning($"No dependencies found for {Name}, does the scene have an ExportInfo and a valid project directory?");
			}
			
			const string SamplesDocsRoot = "https://github.com/needle-tools/needle-engine-samples/";
			const string EngineDocsRoot = "https://engine.needle.tools/docs/component-reference.html";
			
			sampleInfo.UsedComponents = dependencyPaths
				.OrderBy(x => x.path.StartsWith("needle-engine-samples/") ? 0 : 1)
				.ThenBy(x => x.path.StartsWith("engine/src/") ? 0 : 1)
				.ThenBy(x =>
				{
					// Order by script file name instead of path
					if (x.path.EndsWith(".ts")) return Path.GetFileName(x.path);
					return x.path;
				})
				.Select(x =>
				{
					var docsUrl = "";
					const string prefix = "needle-engine-samples/package/";
					if (x.path.StartsWith(prefix))
					{
						var part = x.path.Substring(prefix.Length);
						docsUrl = SamplesDocsRoot + "/tree/main/package/" + part;
					}
					else
					{
						// check if the type has a HelpURL attribute
						var helpUrl = x.type.GetCustomAttributes(typeof(HelpURLAttribute), false).FirstOrDefault() as HelpURLAttribute;
						if (helpUrl != null)
							docsUrl = helpUrl.URL;
						else
							docsUrl = EngineDocsRoot;
					}
					return new SampleInfo.ComponentList
					{
						Component = x.type.Name,
						Path = x.path,
						MoreInfoUrl = docsUrl,
					};
				})
				.ToArray();
			
			EditorUtility.SetDirty(sampleInfo);
		}
    }
}