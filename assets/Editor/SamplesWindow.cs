using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Principal;
using Needle.Engine;
using Needle.Engine.Utils;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEditor.VersionControl;
using UnityEngine;
using UnityEngine.TestTools.Constraints;
using Object = UnityEngine.Object;

namespace Needle
{
	public class SamplesWindow : EditorWindow
	{
		[MenuItem("Needle Engine Samples/Samples Window")]
		public static void Open()
		{
			var existing = Resources.FindObjectsOfTypeAll<SamplesWindow>().FirstOrDefault();
			if (existing)
			{
				existing.Show(true);
				existing.Focus();
			}
			else
			{
				CreateWindow<SamplesWindow>().Show();
			}
		}

		private const string samplesDirectory = "Packages/com.needle.sample-assets/Runtime";
		private const string screenshotsDirectory = "Packages/com.needle.sample-assets/Editor/Screenshots";

		[ContextMenu("Refresh")]
		private void Refresh()
		{
			sampleInfos = AssetDatabase.FindAssets("t:" + nameof(SampleInfo))
				.Select(AssetDatabase.GUIDToAssetPath)
				.Select(AssetDatabase.LoadAssetAtPath<SampleInfo>)
				.ToList();

			AssetDatabase.Refresh();
			// TODO when auto collecting scenes ignore all scenes that are in subfolder depth > 1 (so not directly in a subfolder of the samples directory but further nested)
			var tempSamples = AssetDatabase.FindAssets("t:SceneAsset", new[] { samplesDirectory });
			foreach (var sample in tempSamples)
			{
				var path = AssetDatabase.GUIDToAssetPath(sample);
				var sceneAsset = AssetDatabase.LoadAssetAtPath<SceneAsset>(path);
				if (!sampleInfos.Any(s => s.Scene == sceneAsset))
				{
					var info = ScriptableObject.CreateInstance<SampleInfo>();
					info.Scene = sceneAsset;
					info.name = sceneAsset.name;
					var screenshotPath = screenshotsDirectory + "/" + sceneAsset.name + ".png";
					if (File.Exists(screenshotPath))
					{
						info.Thumbnail = AssetDatabase.LoadAssetAtPath<Texture>(screenshotPath);
					}
					sampleInfos.Add(info);
				}
			}
			
			sampleInfos.Sort((s, o) => (o.Thumbnail ? 1 : 0) - (s.Thumbnail ? 1 : 0));
		}

		private void Awake()
		{
		}

		private void OnEnable()
		{
			titleContent = new GUIContent("Needle Engine Samples");
			Refresh();
			EditorApplication.delayCall += Refresh;
			EditorSceneManager.activeSceneChangedInEditMode += (s, o) => Refresh();
			maxSize = new Vector2(960, 1024);
		}

		private List<SampleInfo> sampleInfos;
		private Vector2 scroll;

		private void OnGUI()
		{
			using var sv = new EditorGUILayout.ScrollViewScope(scroll);
			scroll = sv.scrollPosition;

			GUILayout.Space(10);
			using (new GUILayout.HorizontalScope())
			{
				EditorGUILayout.LabelField("Samples", EditorStyles.largeLabel);
				GUILayout.FlexibleSpace();
				if (GUILayout.Button("Open Documentation " + Constants.ExternalLinkChar))
				{
					Application.OpenURL("https://engine.needle.tools/docs");
				}
				if (GUILayout.Button("Show Samples Directory"))
				{
					var folder = AssetDatabase.LoadAssetAtPath<Object>("Packages/com.needle.sample-assets/Runtime");
					EditorGUIUtility.PingObject(folder);
				}
			}
			GUILayout.Space(15);

			foreach (var sample in sampleInfos)
			{
				if (!sample) continue;
				var preview = sample.Thumbnail;
				if (preview)
				{
					// var aspect = preview.width / (float)preview.height;
					var rect = GUILayoutUtility.GetLastRect();
					rect.y += rect.height;
					rect.width = Screen.width;
					// rect.height = rect.width / aspect;
					rect.height = 64;
					EditorGUI.DrawPreviewTexture(rect, sample.Thumbnail, null, ScaleMode.ScaleAndCrop);
					GUILayout.Space(rect.height);
				}
				using (new GUILayout.HorizontalScope())
				{
					var name = sample.name;
					if (string.IsNullOrWhiteSpace(sample.DisplayName))
					{
						// name = ObjectNames.NicifyVariableName(name);
					}
					else name = sample.DisplayName;

					EditorGUILayout.LabelField(new GUIContent(name, sample.Description), EditorStyles.boldLabel);
					var rect = GUILayoutUtility.GetLastRect();
					if (Event.current.type == EventType.MouseDown && sample.Scene)
					{
						if (rect.Contains(Event.current.mousePosition))
						{
							EditorGUIUtility.PingObject(sample.Scene);
						}
					}

					GUILayout.FlexibleSpace();
					var buttonHeight = EditorGUIUtility.singleLineHeight + 1;
					if (!string.IsNullOrWhiteSpace(sample.LiveUrl))
					{
						if (GUILayout.Button("Live " + Constants.ExternalLinkChar, GUILayout.Height(buttonHeight)))
						{
							Application.OpenURL(sample.LiveUrl);
						}
					}
					if (GUILayout.Button("Open Scene", GUILayout.Height(buttonHeight)))
					{
						EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo();
						EditorSceneManager.OpenScene(AssetDatabase.GetAssetPath(sample.Scene), OpenSceneMode.Single);
					}
				}
				if (sample.Thumbnail)
					GUILayout.Space(10);
				else GUILayout.Space(5);
			}
		}
	}
}