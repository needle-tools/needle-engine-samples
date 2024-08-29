using System;
using System.Linq;
using UnityEditor;
using UnityEngine;

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Facefilter : UnityEngine.MonoBehaviour
	{
		// private static Mesh _mesh;
		
#if UNITY_EDITOR
		private const string k_occlusionMeshGuid = "496edac131102f446961c476f29dcd72";
		
		[NonSerialized]
		private bool _searchedForOcclusionMesh = false;
		[NonSerialized]
		private Transform _fallbackOcclusionMesh;

		private void OnDrawGizmos()
		{
			Gizmos.color = new Color(.5f, .7f, .8f, .5f);
			var scale = new Vector3(.16f, .25f, .15f);
			var position = transform.position;
			position.z -= .03f;

			if (!occlusionMesh && !_searchedForOcclusionMesh)
			{
				_searchedForOcclusionMesh = true;
				var assetPath = UnityEditor.AssetDatabase.GUIDToAssetPath(k_occlusionMeshGuid);
				if (assetPath != null)
				{
					var go = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
					_fallbackOcclusionMesh = go.transform;
				}
			}


			var occlusionMeshObject = occlusionMesh ? occlusionMesh : _fallbackOcclusionMesh;
			var meshFilters = occlusionMeshObject ? 
				occlusionMeshObject?.GetComponentsInChildren<MeshFilter>().ToArray() : Array.Empty<MeshFilter>();
			if (meshFilters?.Length > 0)
			{
				foreach (var mf in meshFilters)
				{
					var t = mf.transform;
					var mesh = mf.sharedMesh;
					Gizmos.matrix = Matrix4x4.TRS(transform.position + t.localPosition, t.rotation, t.localScale);
					Gizmos.DrawMesh(mesh, 0);
					var col2 = Gizmos.color;
					col2.a = .05f;
					Gizmos.color = col2;
					Gizmos.DrawWireMesh(mesh, 0);
				}
			}
			else
			{
				Gizmos.matrix = Matrix4x4.TRS(position, Quaternion.identity, scale);
				Gizmos.DrawWireSphere(Vector3.zero, .5f);
			}
		} 
#endif
	}
}

// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Facefilter : UnityEngine.MonoBehaviour
	{
		public UnityEngine.Transform[] @filters = new UnityEngine.Transform[]{ };
		public UnityEngine.Transform @occlusionMesh;
		public bool @createOcclusionMesh = true;
		public void getBlendshapeValue(object @shape, float @index){}
		public void selectNextFilter(){}
		public void selectPreviousFilter(){}
		public void select(float @index){}
		public void awake(){}
		public void OnEnable(){}
		public void OnDisable(){}
		public void earlyUpdate(){}
		public void onBeforeRender(){}
	}
}

// NEEDLE_CODEGEN_END