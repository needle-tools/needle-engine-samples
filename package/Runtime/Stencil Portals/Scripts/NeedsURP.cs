using System;
using Needle.Engine;
using UnityEditor;
using UnityEngine;

namespace Needle
{
	[NeedleDefaultHeader]
	public class NeedsURP : MonoBehaviour
	{
#if UNITY_EDITOR

		[UnityEditor.CustomEditor(typeof(NeedsURP))]
		internal class URPEditor : UnityEditor.Editor
		{
			public override void OnInspectorGUI()
			{
				base.OnInspectorGUI();

				if (!UnityEngine.Rendering.GraphicsSettings.currentRenderPipeline ||
					UnityEngine.Rendering.GraphicsSettings.currentRenderPipeline.GetType().Name.Contains("Universal") == false)
				{
					EditorGUILayout.HelpBox("This scene requires the Universal Render Pipeline (URP) to function correctly. Please ensure that URP is set up in your project settings.", MessageType.Warning);
				}
				else
				{
					EditorGUILayout.HelpBox("The Universal Render Pipeline (URP) is correctly set up in this project.", MessageType.Info);
				}
			}
		}
#endif
	}
}