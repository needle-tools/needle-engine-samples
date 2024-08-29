using System;
using System.Linq;
using UnityEngine;


namespace Needle.Typescript.GeneratedComponents
{
	public partial class Facefilter : UnityEngine.MonoBehaviour
	{
		// private static Mesh _mesh;
		
		private void OnDrawGizmos()
		{
			Gizmos.color = new Color(.5f, .7f, .8f, .9f);
			var scale = new Vector3(.16f, .25f, .15f);
			var position = transform.position;
			position.z -= .03f;

			var meshFilters = occlusionMesh?.GetComponentsInChildren<MeshFilter>().ToArray() ?? Array.Empty<MeshFilter>();
			if (meshFilters.Length > 0)
			{
				foreach (var mf in meshFilters)
				{
					var t = mf.transform;
					var mesh = mf.sharedMesh;
					Gizmos.matrix = Matrix4x4.TRS(transform.position + t.localPosition, t.rotation, t.localScale);
					Gizmos.DrawMesh(mesh, 0);
				}
			}
			else
			{
				Gizmos.matrix = Matrix4x4.TRS(position, Quaternion.identity, scale);
				Gizmos.DrawWireSphere(Vector3.zero, .5f);
			}
		} 
	}
}

// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Facefilter : UnityEngine.MonoBehaviour
	{
		public UnityEngine.GameObject @asset;
		public UnityEngine.Transform @occlusionMesh;
		public void getBlendshapeValue(object @shape, float @index){}
		public void awake(){}
		public void OnEnable(){}
		public void OnDisable(){}
		public void earlyUpdate(){}
		public void onBeforeRender(){}
	}
}

// NEEDLE_CODEGEN_END