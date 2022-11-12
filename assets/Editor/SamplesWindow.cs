using System.Collections.Generic;
using System.IO;
using System.Linq;
using Needle.Engine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UIElements;
using Object = UnityEngine.Object;
using Task = System.Threading.Tasks.Task;

namespace Needle
{
	public class SamplesWindow : EditorWindow, IHasCustomMenu
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

		private static bool didOpen
		{
			get => SessionState.GetBool("OpenedNeedleSamplesWindow", false);
			set => SessionState.SetBool("OpenedNeedleSamplesWindow", value);
		}

		[InitializeOnLoadMethod]
		private static async void Init()
		{
			if (didOpen) return;
			didOpen = true;
			await Task.Yield();
			Open();
		}

		private const string samplesDirectory = "Packages/com.needle.sample-assets/Runtime";
		private const string screenshotsDirectory = "Packages/com.needle.sample-assets/Editor/Screenshots";
		
		public void AddItemsToMenu(GenericMenu menu)
		{
			menu.AddItem(new GUIContent("Refresh"), false, Refresh);
			menu.AddItem(new GUIContent("Reopen Window"), false, () =>
			{
				Close();
				Open();
			});
		}
		
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
					if (TryGetScreenshot(sceneAsset.name, out var screenshotPath))
					{
						info.Thumbnail = AssetDatabase.LoadAssetAtPath<Texture>(screenshotPath);
					}
					sampleInfos.Add(info);
				}
			}

			sampleInfos.Sort((s, o) => (o.Thumbnail ? 1 : 0) - (s.Thumbnail ? 1 : 0));
		}

		private bool TryGetScreenshot(string name, out string path)
		{
			path = screenshotsDirectory + "/" + name + ".png";
			if (File.Exists(path)) return true;
			path = screenshotsDirectory + "/" + name + ".jpg";
			return File.Exists(path);
		}

		private void OnEnable()
		{
			titleContent = new GUIContent(
				"Needle Engine Samples", 
				AssetDatabase.LoadAssetAtPath<Texture2D>(AssetDatabase.GUIDToAssetPath("39a802f6842d896498768ef6444afe6f")));
			Refresh();
			EditorApplication.delayCall += Refresh;
			EditorSceneManager.activeSceneChangedInEditMode += (s, o) => Refresh();
			maxSize = new Vector2(10000, 5000);
			minSize = new Vector2(360, 420);
			
			// TODO not sure how to only do this if this window hasn't been manually resized by the user
			var p = position;
			p.width = 1080;
			position = p;
		}

		private List<SampleInfo> sampleInfos;
		private Vector2 scroll;
		private double lastClickTime;

		private void CreateGUI()
		{
			var scrollView = new ScrollView();

			var header = new VisualElement();
			header.AddToClassList("header");
			header.Add(new Label("Explore Needle Engine Samples"));
			var buttonContainer = new VisualElement();
			buttonContainer.AddToClassList("buttons");
			buttonContainer.Add(new Button(() =>
			{
				Application.OpenURL("https://engine.needle.tools/docs");
			}) { text = "Open Documentation " + Constants.ExternalLinkChar});
			buttonContainer.Add(new Button(() => 
			{
				var folder = AssetDatabase.LoadAssetAtPath<Object>("Packages/com.needle.sample-assets/Runtime");
				EditorGUIUtility.PingObject(folder);
			}) { text = "Show Samples Folder" });
			header.Add(buttonContainer);
			scrollView.Add(header);

			// samples with thumbnails
			var itemContainer = new VisualElement();
			itemContainer.AddToClassList("items");
			foreach (var sample in sampleInfos.Where(x => x.Thumbnail))
				itemContainer.Add(new Sample(sample));
			scrollView.Add(itemContainer);
			
			// samples without thumbnails
			var itemContainerNoThumbnail = new VisualElement();
			itemContainerNoThumbnail.AddToClassList("items");
			foreach (var sample in sampleInfos.Where(x => !x.Thumbnail))
				itemContainerNoThumbnail.Add(new Sample(sample));
			scrollView.Add(itemContainerNoThumbnail);
			
			rootVisualElement.Add(scrollView);
			rootVisualElement.styleSheets.Add(AssetDatabase.LoadAssetAtPath<StyleSheet>(AssetDatabase.GUIDToAssetPath("1d7049f4814274e4b9f6f99f2bc36c90")));

			// responsive layout - basically a media query for screen width
			const int columnWidth = 360;
			rootVisualElement.RegisterCallback<GeometryChangedEvent>(evt =>
			{
				for(int i = 0; i < 20; i++)
					scrollView.RemoveFromClassList("__columns_" + i);
				scrollView.AddToClassList("__columns_" +Mathf.FloorToInt(evt.newRect.width / columnWidth));
			});
		}

		class Sample : VisualElement
		{
			private SampleInfo sample;
			
			public Sample(SampleInfo sample)
			{
				this.sample = sample;
				if (!sample.Thumbnail)
				{
					AddToClassList("no-preview");
				}
				else
				{
					var preview = new Image() { image = sample.Thumbnail };
					Add(preview);
				}

				var click = new Clickable(DoubleClick);
				click.activators.Clear();
				click.activators.Add(new ManipulatorActivationFilter() { button = MouseButton.LeftMouse, clickCount = 2} );
				this.AddManipulator(click);
				this.AddManipulator(new Clickable(Click));

				var content = new VisualElement() { name = "Content" };
				var overlay = new VisualElement();
				overlay.AddToClassList("overlay");
				overlay.Add(new Label() { name = "Title", text = sample.DisplayNameOrName } );
				overlay.Add(new Label() { text = sample.Description } );
				content.Add(overlay);
				
				var options = new VisualElement();
				options.AddToClassList("options");
				if (!string.IsNullOrEmpty(sample.LiveUrl))
					options.Add(new Button(_Live) { text = "Live ↗", tooltip = "Open " + sample.LiveUrl});
				if (sample.Scene)
					options.Add(new Button(_OpenScene) { text = "Open Scene" });
				content.Add(options);
				Add(content);
			}

			private void DoubleClick(EventBase evt) => OpenScene(sample.Scene);
			private void Click(EventBase evt) => EditorGUIUtility.PingObject(sample.Scene);
			private void _OpenScene() => OpenScene(sample.Scene);
			private void _Live() => Application.OpenURL(sample.LiveUrl);
		}

		private static void OpenScene(SceneAsset asset)
		{
			EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo();
			EditorSceneManager.OpenScene(AssetDatabase.GetAssetPath(asset), OpenSceneMode.Single);
			GUIUtility.ExitGUI();
		}
	}
}