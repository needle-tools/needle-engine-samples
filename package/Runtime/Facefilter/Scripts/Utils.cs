using System;
using System.IO;
using System.Linq;
using Needle.Engine.Utils;
using Needle.Typescript.GeneratedComponents;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEditor.VersionControl;
using UnityEngine;
using Object = UnityEngine.Object;
using Task = System.Threading.Tasks.Task;


namespace Needle.Facefilter.Scripts
{
	internal static class Utils
	{
		private const string k_occlusionMeshGuid = "496edac131102f446961c476f29dcd72";
		
		[NonSerialized]
		private static bool _searchedForOcclusionMesh = false;
		[NonSerialized]
		private static  Transform _fallbackOcclusionMesh;
		
		public static void RenderHeadGizmo(Component comp, Transform assignedOcclusionMesh = null)
		{
			var transform = comp.transform;
			
			Gizmos.color = new Color(.5f, .7f, .8f, .5f);
			var position = transform.position;
			position.z -= .03f;

			if (!assignedOcclusionMesh && !_searchedForOcclusionMesh)
			{
				_searchedForOcclusionMesh = true;
				var assetPath = UnityEditor.AssetDatabase.GUIDToAssetPath(k_occlusionMeshGuid);
				if (assetPath != null)
				{
					var go = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
					_fallbackOcclusionMesh = go.transform;
				}
			}


			var occlusionMeshObject = assignedOcclusionMesh ? assignedOcclusionMesh : _fallbackOcclusionMesh;
			var meshFilters = occlusionMeshObject ? 
				occlusionMeshObject?.GetComponentsInChildren<MeshFilter>().ToArray() : Array.Empty<MeshFilter>();
			if (meshFilters?.Length > 0)
			{
				foreach (var mf in meshFilters)
				{
					var t = mf.transform;
					var mesh = mf.sharedMesh;
					var scale = transform.lossyScale;
					scale.Scale(t.localScale);
					Gizmos.matrix = Matrix4x4.TRS(transform.position, t.rotation * transform.rotation,  scale);
					Gizmos.DrawMesh(mesh, 0);
					var col2 = Gizmos.color;
					col2.a = .05f;
					Gizmos.color = col2;
					Gizmos.DrawWireMesh(mesh, 0);
				}
			}
			else
			{
				var scale = new Vector3(.16f, .25f, .15f);
				Gizmos.matrix = Matrix4x4.TRS(position, Quaternion.identity, scale);
				Gizmos.DrawWireSphere(Vector3.zero, .5f);
			}
		}

		public static async void CreateNewFilterAsset(Component comp)
		{
			
			var directory = "Assets/Needle Face Filter";
			if(!Directory.Exists(directory)) Directory.CreateDirectory(directory);

			GameObject go = null;
			
			var templateInstancePath = AssetDatabase.GUIDToAssetPath("6c4808ce137677242a27815509fb59c5");
			if (!string.IsNullOrEmpty(templateInstancePath))
			{
				go = AssetDatabase.LoadAssetAtPath<GameObject>(templateInstancePath);
				go = Object.Instantiate(go);
			}

			if (!go)
			{
				go = new GameObject("My Filter");
				Undo.RegisterCreatedObjectUndo(go, "Create Filter");
				go.AddComponent<FaceFilterRoot>();
				var headMarker = new GameObject("Filter Head Position Marker");
				headMarker.AddComponent<FaceFilterHeadPosition>();
				headMarker.transform.SetParent(go.transform, false);

			}
			
			var path = directory + "/MyFilter.prefab";
			path = AssetDatabase.GenerateUniqueAssetPath(path);
			var asset = PrefabUtility.SaveAsPrefabAsset(go, path);
			Undo.RegisterCreatedObjectUndo(asset, "Create Filter");
			go.SafeDestroy();
			if (asset)
			{
				var component = (NeedleFilterTrackingManager)comp;
				var list = component.filters.Where((f => f)).ToList();
				var isFirstAsset = list.Count == 0;
				list.Add(asset.transform);
				component.filters = list.ToArray();

				EditorGUIUtility.PingObject(asset);
				SceneView.lastActiveSceneView?.ShowNotification(new GUIContent("New Filter created and added to the filters list."));

				if (isFirstAsset)
					await Task.Delay(2000);
				else await Task.Delay(500);
				
				var finalPath = AssetDatabase.GetAssetPath(asset);
				Debug.Log("Successfully created new Needle Filter at " + finalPath, asset);
				if (!isFirstAsset || EditorUtility.DisplayDialog("Needle Filter", "Congrats: you created your first filter. Do you want to open the filter asset now to customize it?", "Open the Filter to customize",
					    "Do not open now"))
				{
					PrefabStageUtility.OpenPrefab(finalPath);
					SceneView.lastActiveSceneView?.ShowNotification(new GUIContent("Edit your filter now!"));
				}
			}
		}
		
		public static readonly string[] supportedBlendshapeNames = new[]
		{
			"_neutral",
			"browDownLeft",
			"browDownRight",
			"browInnerUp",
			"browOuterUpLeft",
			"browOuterUpRight",
			"cheekPuff",
			"cheekSquintLeft",
			"cheekSquintRight",
			"eyeBlinkLeft",
			"eyeBlinkRight",
			"eyeLookDownLeft",
			"eyeLookDownRight",
			"eyeLookInLeft",
			"eyeLookInRight",
			"eyeLookOutLeft",
			"eyeLookOutRight",
			"eyeLookUpLeft",
			"eyeLookUpRight",
			"eyeSquintLeft",
			"eyeSquintRight",
			"eyeWideLeft",
			"eyeWideRight",
			"jawForward",
			"jawLeft",
			"jawOpen",
			"jawRight",
			"mouthClose",
			"mouthDimpleLeft",
			"mouthDimpleRight",
			"mouthFrownLeft",
			"mouthFrownRight",
			"mouthFunnel",
			"mouthLeft",
			"mouthLowerDownLeft",
			"mouthLowerDownRight",
			"mouthPressLeft",
			"mouthPressRight",
			"mouthPucker",
			"mouthRight",
			"mouthRollLower",
			"mouthRollUpper",
			"mouthShrugLower",
			"mouthShrugUpper",
			"mouthSmileLeft",
			"mouthSmileRight",
			"mouthStretchLeft",
			"mouthStretchRight",
			"mouthUpperUpLeft",
			"mouthUpperUpRight",
			"noseSneerLeft",
			"noseSneerRight"
		};
	}
}