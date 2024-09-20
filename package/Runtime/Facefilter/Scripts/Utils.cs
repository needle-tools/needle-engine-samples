using System;
using System.IO;
using System.Linq;
using Needle.Engine.Utils;
using Needle.Typescript.GeneratedComponents;
using UnityEditor;
using UnityEngine;
using Object = UnityEngine.Object;
using Task = System.Threading.Tasks.Task;


namespace Needle.Facefilter.Scripts
{
	internal static class Utils
	{
#if UNITY_EDITOR
		[NonSerialized] private static bool _searchedForOcclusionMesh = false;
		[NonSerialized] private static Transform _fallbackOcclusionMesh;
#endif

		public static void RenderHeadGizmo(Component comp, Transform assignedOcclusionMesh = null, float alphaFactor = 1f)
		{
#if UNITY_EDITOR
			var transform = comp.transform;

			Gizmos.color = new Color(.5f, .7f, .8f, .5f * alphaFactor);
			var position = transform.position;
			position.z -= .03f;

			if (!assignedOcclusionMesh && !_searchedForOcclusionMesh)
			{
				_searchedForOcclusionMesh = true;
				var assetPath = UnityEditor.AssetDatabase.GUIDToAssetPath("496edac131102f446961c476f29dcd72");
				if (assetPath != null)
				{
					var go = UnityEditor.AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
					_fallbackOcclusionMesh = go.transform;
				}
			}


			var occlusionMeshObject = assignedOcclusionMesh ? assignedOcclusionMesh : _fallbackOcclusionMesh;
			var meshFilters = occlusionMeshObject
				? occlusionMeshObject?.GetComponentsInChildren<MeshFilter>().ToArray()
				: Array.Empty<MeshFilter>();
			if (meshFilters?.Length > 0)
			{
				foreach (var mf in meshFilters)
				{
					var t = mf.transform;
					var mesh = mf.sharedMesh;
					var scale = transform.lossyScale;
					scale.Scale(t.localScale);
					Gizmos.matrix = Matrix4x4.TRS(transform.position, t.rotation * transform.rotation, scale);
					Gizmos.DrawMesh(mesh, 0);
					var col2 = Gizmos.color;
					col2.a = .05f * alphaFactor;
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
#endif
		}

		[NonSerialized] private static Mesh _facemesh;
		private static Material _material;
		private static Texture _fallbackTexture;

		internal static void EnsureFaceMeshSetup()
		{
#if UNITY_EDITOR
			if (!_material)
			{
				var materialPath = UnityEditor.AssetDatabase.GUIDToAssetPath("88c16fb738b72a84883ca22d5ba1536e");
				if (!string.IsNullOrEmpty(materialPath))
				{
					_material = AssetDatabase.LoadAssetAtPath<Material>(materialPath);
					_material = Object.Instantiate(_material);
					_material.hideFlags = HideFlags.DontSave;
				}
			}
			if (!_facemesh)
			{
				var faceMeshPath = UnityEditor.AssetDatabase.GUIDToAssetPath("c4913f20ddb214d678a1f7fd797c3994");
				if (!string.IsNullOrEmpty(faceMeshPath))
				{
					_facemesh = AssetDatabase.LoadAssetAtPath<GameObject>(faceMeshPath)
						.GetComponentInChildren<MeshFilter>().sharedMesh;
				}
			}
			if (!_fallbackTexture)
			{
				var texturePath = UnityEditor.AssetDatabase.GUIDToAssetPath("654a21ed4f3ea5d4c8b60471f0198ca3");
				if (!string.IsNullOrEmpty(texturePath))
				{
					_fallbackTexture = AssetDatabase.LoadAssetAtPath<Texture>(texturePath); 
				}
			}
#endif
		}

		public static void RenderFaceGizmo(FaceMeshTexture comp)
		{
			EnsureFaceMeshSetup();

			if (_material && _facemesh)
			{
				var transform = comp.transform;
				if (comp.texture)
					_material.SetTexture("baseColorTexture", comp.texture);
				else
				{
					_material.SetTexture("baseColorTexture", _fallbackTexture);
				}

				var uv = comp.layout == "procreate" ? 1 : 0;
				_material.SetFloat("baseColorTextureTexCoord", uv);

				if (_material.SetPass(0))
				{
					var mat = transform.localToWorldMatrix;
					// var scaleMat = Matrix4x4.Scale(new Vector3(.1f, .1f, .1f));
					// mat = mat * scaleMat;
					Graphics.DrawMeshNow(_facemesh, mat, 0);
				}
			}
		}

		public static void RenderFaceGizmo(FaceMeshCustomShader comp)
		{
			EnsureFaceMeshSetup();

			if (_facemesh && comp.material)
			{
				var transform = comp.transform;
				
				if (comp.material.SetPass(0))
				{
					var mat = transform.localToWorldMatrix;
					var scaleMat = Matrix4x4.Scale(new Vector3(.1f, .1f, .1f));
					mat = mat * scaleMat;
					Graphics.DrawMeshNow(_facemesh, mat, 0);
				}
			}
		}

#if UNITY_EDITOR
		public static async void CreateNewFilterAsset(Component comp)
		{
			var directory = "Assets/Needle Face Filter";
			if (!Directory.Exists(directory)) Directory.CreateDirectory(directory);

			GameObject go = null;

			var templateInstancePath = UnityEditor.AssetDatabase.GUIDToAssetPath("6c4808ce137677242a27815509fb59c5");
			if (!string.IsNullOrEmpty(templateInstancePath))
			{
				go = UnityEditor.AssetDatabase.LoadAssetAtPath<GameObject>(templateInstancePath);
				go = Object.Instantiate(go);
			}

			if (!go)
			{
				go = new GameObject("My Filter");
				UnityEditor.Undo.RegisterCreatedObjectUndo(go, "Create Filter");
				go.AddComponent<FaceFilterRoot>();
				var headMarker = new GameObject("Filter Head Position Marker");
				headMarker.AddComponent<FaceFilterHeadPosition>();
				headMarker.transform.SetParent(go.transform, false);
			}

			var path = directory + "/MyFilter.prefab";
			path = UnityEditor.AssetDatabase.GenerateUniqueAssetPath(path);
			var asset = UnityEditor.PrefabUtility.SaveAsPrefabAsset(go, path);
			UnityEditor.Undo.RegisterCreatedObjectUndo(asset, "Create Filter");
			go.SafeDestroy();
			if (asset)
			{
				var component = (NeedleFilterTrackingManager)comp;
				var list = component.filters.Where((f => f)).ToList();
				var isFirstAsset = list.Count == 0;
				list.Add(asset.transform);
				component.filters = list.ToArray();

				UnityEditor.EditorGUIUtility.PingObject(asset);
				UnityEditor.SceneView.lastActiveSceneView?.ShowNotification(
					new GUIContent("New Filter created and added to the filters list."));

				if (isFirstAsset)
					await Task.Delay(2000);
				else await Task.Delay(500);

				var finalPath = UnityEditor.AssetDatabase.GetAssetPath(asset);
				Debug.Log("Successfully created new Needle Filter at " + finalPath, asset);
				if (!isFirstAsset || UnityEditor.EditorUtility.DisplayDialog("Needle Filter",
					    "Congrats: you created your first filter. Do you want to open the filter asset now to customize it?",
					    "Open the Filter to customize",
					    "Do not open now"))
				{
					UnityEditor.SceneManagement.PrefabStageUtility.OpenPrefab(finalPath);
					UnityEditor.SceneView.lastActiveSceneView?.ShowNotification(
						new GUIContent("Edit your filter now!"));
				}
			}
		}
#endif

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