using System;
using System.IO;
using System.Linq;
using Needle.Engine.Utils;
using Needle.Facefilter.Scripts;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;


namespace Needle.Typescript.GeneratedComponents
{
	public partial class NeedleFilterTrackingManager
	{
#if UNITY_EDITOR
		[UnityEditor.CustomEditor(typeof(NeedleFilterTrackingManager))]
		private class Editor : UnityEditor.Editor
		{
			public override void OnInspectorGUI()
			{
				var self = (NeedleFilterTrackingManager) this.target;
				EditorGUILayout.LabelField("How to Use", EditorStyles.boldLabel);
				EditorGUILayout.HelpBox("You can create new prefabs using the button below or by adding the FaceFilter component to a new object. Filters can be part of this scene or inside separate prefabs to speedup loading time (recommended). Click the button below to create a new filter using our template prefab:", MessageType.None);
				var text = self.filters.Length <= 0 ? "Create Your First Filter" : "Create New Filter";
				if (GUILayout.Button(text, GUILayout.Height(24)))
				{
					Utils.CreateNewFilterAsset(self);
				}
				EditorGUILayout.HelpBox("Then add your filter to the \"Filters\" list below", MessageType.None);

				GUILayout.Space(5);
				base.OnInspectorGUI();				
				
				GUILayout.Space(5);
				
			}
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
				EditorGUILayout.HelpBox("Add this component to a GameObject in your Filter and place it to match the head position (Enable Gizmos if you don't see the head visualization in the scene).\n\nYou can either use the gizmo to place your model on the face or you can move, scale or rotate the gizmo to fit your model (it can be added anywhere in your filter hierarchy but make sure you only use it once because humans only have one head, right?)", MessageType.None);
			}
		}
#endif
	}
	

	public partial class FaceFilterRoot
	{
#if UNITY_EDITOR

		private void OnDrawGizmos()
		{
			if (!GetComponentInChildren<FaceFilterHeadPosition>())
			{
				Utils.RenderHeadGizmo(this, null);
			}
		}

		[UnityEditor.CustomEditor(typeof(FaceFilterRoot))]
		private class Editor : UnityEditor.Editor
		{
			private FaceFilterHeadPosition _headPosition;
			private FaceFilterAnimator _animator;
			
			private void OnEnable()
			{
				_headPosition = (this.target as Component)!.GetComponentInChildren<FaceFilterHeadPosition>();
                _animator = (this.target as Component)!.GetComponentInChildren<FaceFilterAnimator>();
			}

			public override void OnInspectorGUI()
			{
				EditorGUILayout.HelpBox("Put this component at the Root GameObject of your filter and add the filter to the FaceFilterManager \"Filters\" array to use it in the web.", MessageType.None);
				
				base.OnInspectorGUI();
				
				if (!_headPosition)
				{
					EditorGUILayout.HelpBox("Click the button to position the filter.", MessageType.None);
					if (GUILayout.Button("Configure Head Position/Size (Optional)", GUILayout.Height(32)))
					{
						var obj = new GameObject("Needle Filter Head Position");
						Undo.RegisterCreatedObjectUndo(obj, "Create Head Position");
						_headPosition = obj.AddComponent<FaceFilterHeadPosition>();
						obj.transform.SetParent((this.target as Component)!.transform, false);
						Selection.activeObject = obj;
					}
				}
				// if (!_animator)
				// {
				// 	if (GUILayout.Button("Add Animator (Optional)", GUILayout.Height(32)))
				// 	{
				// 		_animator = Undo.AddComponent<FaceFilterAnimator>(((Component)target).gameObject);
				// 	}
				// }
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
				EditorGUILayout.LabelField(string.Join(", ", Utils.supportedBlendshapeNames), optionsStyle);
			}
		}
	}
	
	public partial class FaceFilterAnimator
	{
		[CustomEditor(typeof(FaceFilterAnimator))]
		internal class Editor : UnityEditor.Editor
		{
			private UnityEngine.GUIStyle optionsStyle;

			public override void OnInspectorGUI()
			{
				base.OnInspectorGUI();
				// TODO: allow for remapping with a nice GUI
				
				EditorGUILayout.LabelField("Supported Float Parameter Names", EditorStyles.boldLabel);
				optionsStyle ??= new UnityEngine.GUIStyle(EditorStyles.label);
				optionsStyle.wordWrap = true;
				optionsStyle.normal.textColor = Color.gray;
				EditorGUILayout.LabelField("- " + string.Join("\n- ", Utils.supportedBlendshapeNames), optionsStyle);
			}
		}
		
	}
}