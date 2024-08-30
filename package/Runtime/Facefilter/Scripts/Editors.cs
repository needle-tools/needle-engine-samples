using System;
using Needle.Facefilter.Scripts;
using UnityEditor;
using UnityEngine;


namespace Needle.Typescript.GeneratedComponents
{
	public partial class Facefilter
	{
#if UNITY_EDITOR
		private void OnDrawGizmos()
		{
			Utils.RenderHeadGizmo(this, this.occlusionMesh);
		} 
#endif
	}
	
	public partial class FaceFilterHeadPosition
	{
#if UNITY_EDITOR
		private void OnDrawGizmos()
		{
			Utils.RenderHeadGizmo(this);
		}
		[UnityEditor.CustomEditor(typeof(FaceFilterHeadPosition))]
		private class Editor : UnityEditor.Editor
		{
			public override void OnInspectorGUI()
			{
				base.OnInspectorGUI();
				EditorGUILayout.HelpBox("Add this component to an Object in your FaceFilter and place it to match the head position (Enable Gizmos if you don't see the head visualization in the scene). This will be used to place the virtual avatar", MessageType.None);
			}
		}
#endif
	}
	

	public partial class FaceFilterRoot
	{
#if UNITY_EDITOR
		[UnityEditor.CustomEditor(typeof(FaceFilterRoot))]
		private class Editor : UnityEditor.Editor
		{
			private FaceFilterHeadPosition _headPosition;
			
			private void OnEnable()
			{
				_headPosition = (this.target as Component)!.GetComponentInChildren<FaceFilterHeadPosition>();
			}

			public override void OnInspectorGUI()
			{
				base.OnInspectorGUI();
				if (!_headPosition)
				{
					EditorGUILayout.HelpBox("Consider defining the head position of your filter", MessageType.Info);
					if (GUILayout.Button("Configure head position"))
					{
						var obj = new GameObject("Needle Filter Head Position");
						Undo.RegisterCreatedObjectUndo(obj, "Create Head Position");
						_headPosition = obj.AddComponent<FaceFilterHeadPosition>();
						obj.transform.SetParent((this.target as Component)!.transform, false);
						Selection.activeObject = obj;
					}
				}
			}
		}
#endif
	}
	
	
	public partial class FaceBlendshapes
	{
		[CustomEditor(typeof(FaceBlendshapes))]
		internal class Editor : UnityEditor.Editor
		{
			private UnityEngine.GUIStyle optionsStyle;

			public override void OnInspectorGUI()
			{
				base.OnInspectorGUI();
				// TODO: allow for remapping with a nice GUI
				
				EditorGUILayout.LabelField("Supported Blendshapes", EditorStyles.boldLabel);
				optionsStyle ??= new UnityEngine.GUIStyle(EditorStyles.label);
				optionsStyle.wordWrap = true;
				optionsStyle.normal.textColor = Color.gray;
				EditorGUILayout.LabelField(string.Join(", ", supportedBlendshapeNames), optionsStyle);
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