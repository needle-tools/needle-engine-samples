using System;
using Needle.Engine.Components;
using Needle.Facefilter.Scripts;
using UnityEditor;
using UnityEngine;
using UnityEngine.Scripting;


namespace Needle.Typescript.GeneratedComponents
{
	[AddComponentMenu("Needle Engine/Face Filter/Face Head (Gizmo)")]
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
				UnityEditor.EditorGUILayout.HelpBox(
					"Add this component to a GameObject in your Filter and place it to match the head position (Enable Gizmos if you don't see the head visualization in the scene).\n\nYou can either use the gizmo to place your model on the face or you can move, scale or rotate the gizmo to fit your model (it can be added anywhere in your filter hierarchy but make sure you only use it once because humans only have one head, right?)",
					UnityEditor.MessageType.None);
			}
		}
#endif
	}


	[AddComponentMenu("Needle Engine/Face Filter/Face Filter Root")]
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
				UnityEditor.EditorGUILayout.HelpBox(
					"Put this component at the Root GameObject of your filter and add the filter to the FaceFilterManager \"Filters\" array to use it in the web.",
					UnityEditor.MessageType.None);

				base.OnInspectorGUI();

				if (!_headPosition)
				{
					UnityEditor.EditorGUILayout.HelpBox("Click the button to position the filter.",
						UnityEditor.MessageType.None);
					if (GUILayout.Button("Configure Head Position/Size (Optional)", GUILayout.Height(32)))
					{
						var obj = new GameObject("Needle Filter Head Position");
						UnityEditor.Undo.RegisterCreatedObjectUndo(obj, "Create Head Position");
						_headPosition = obj.AddComponent<FaceFilterHeadPosition>();
						obj.transform.SetParent((this.target as Component)!.transform, false);
						UnityEditor.Selection.activeObject = obj;
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


	[AddComponentMenu("Needle Engine/Face Filter/Face Blendshapes")]
	public partial class FaceBlendshapes
	{
#if UNITY_EDITOR
		[UnityEditor.CustomEditor(typeof(FaceBlendshapes))]
		internal class Editor : UnityEditor.Editor
		{
			private UnityEngine.GUIStyle optionsStyle;

			public override void OnInspectorGUI()
			{
				base.OnInspectorGUI();
				// TODO: allow for remapping with a nice GUI

				UnityEditor.EditorGUILayout.LabelField("Supported Blendshapes", UnityEditor.EditorStyles.boldLabel);
				optionsStyle ??= new UnityEngine.GUIStyle(UnityEditor.EditorStyles.label);
				optionsStyle.wordWrap = true;
				optionsStyle.normal.textColor = Color.gray;
				UnityEditor.EditorGUILayout.LabelField(string.Join(", ", Utils.supportedBlendshapeNames), optionsStyle);
			}
		}
#endif
	}

	[AddComponentMenu("Needle Engine/Face Filter/Face Animator")]
	public partial class FaceFilterAnimator
	{
#if UNITY_EDITOR
		[UnityEditor.CustomEditor(typeof(FaceFilterAnimator))]
		internal class Editor : UnityEditor.Editor
		{
			private UnityEngine.GUIStyle optionsStyle;

			public override void OnInspectorGUI()
			{
				base.OnInspectorGUI();
				// TODO: allow for remapping with a nice GUI

				UnityEditor.EditorGUILayout.LabelField("Supported Float Parameter Names",
					UnityEditor.EditorStyles.boldLabel);
				optionsStyle ??= new UnityEngine.GUIStyle(UnityEditor.EditorStyles.label);
				optionsStyle.wordWrap = true;
				optionsStyle.normal.textColor = Color.gray;
				UnityEditor.EditorGUILayout.LabelField("- " + string.Join("\n- ", Utils.supportedBlendshapeNames),
					optionsStyle);
			}
		}
#endif
	}

	[AddComponentMenu("Needle Engine/Face Filter/Face Mesh: Texture")]
	public partial class FaceMeshTexture
	{
		public enum Layout
		{
			Mediapipe = 0,
			Procreate = 1,
		}

		public Layout _layout = Layout.Mediapipe;

		public string mode
		{
			get
			{
				switch (_layout)
				{
					case Layout.Mediapipe:
						return "mediapipe";
					case Layout.Procreate:
						return "procreate";
				}
				return "";
			}
		}

		private void OnDrawGizmos()
		{
			Utils.RenderFaceGizmo(this);
		}
#if UNITY_EDITOR
		[UnityEditor.CustomEditor(typeof(FaceMeshTexture))]
		internal class Editor : UnityEditor.Editor
		{
			private GUIStyle helpStyle;

			public override void OnInspectorGUI()
			{
				base.OnInspectorGUI();
				
				helpStyle ??= GUI.skin.GetStyle("HelpBox");
				helpStyle.richText = true;
				
				// ReSharper disable once LocalVariableHidesMember
				var target = (FaceMeshTexture) this.target;
				
				GUILayout.Space(3);
				switch (target._layout)
				{
					case Layout.Mediapipe:
						EditorGUILayout.TextArea("Using the Mediapipe layout. Select this if your texture was created for Meta Spark or is using the <a href=\"https://spark.meta.com/learn/articles/creating-and-prepping-assets/the-face-mask-template-in-Adobe/\">Meta Spark template</a> or another tool that is using the ARCore face mesh tracking.", helpStyle);
						break;
					case Layout.Procreate:
						EditorGUILayout.HelpBox("Using the Procreate layout. Select this if your texture was created using <a href=\"https://help.procreate.com/procreate/handbook/actions/actions-canvas#pz13yy3eihh\">Procreate's FacePaint feature</a> (or another iOS app that is using Apple ARKit Face Mesh tracking)", MessageType.None);
						break;
				}
			}
		}
#endif
	}
		
	[AddComponentMenu("Needle Engine/Face Filter/Face Mesh: Video")]
	public partial class FaceMeshVideo
	{
	}
}