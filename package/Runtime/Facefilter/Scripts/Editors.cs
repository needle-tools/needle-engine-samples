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
			if(isActiveAndEnabled)
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
				if (isActiveAndEnabled)
				{
					var faceMesh = GetComponentInChildren<FaceMeshBehaviour>();
					Utils.RenderHeadGizmo(this, null, faceMesh ? .1f : 1);
				}
			}
		}

		[UnityEditor.CustomEditor(typeof(FaceFilterRoot))]
		private class Editor : UnityEditor.Editor
		{
			private FaceFilterHeadPosition _headPosition;
			private FaceMeshBehaviour _faceMeshBehaviour;
			
			private FaceFilterAnimator _animator;

			private void OnEnable()
			{
				_headPosition = (this.target as Component)!.GetComponentInChildren<FaceFilterHeadPosition>();
				_animator = (this.target as Component)!.GetComponentInChildren<FaceFilterAnimator>();
			}

			public override void OnInspectorGUI()
			{
				UnityEditor.EditorGUILayout.HelpBox(
					"Put this component at the Root GameObject of your filter - then add the filter to the FaceFilterManager \"Filters\" array to use it in the web.",
					UnityEditor.MessageType.None);

				base.OnInspectorGUI();

				if (!_headPosition)
				{
					GUILayout.Space(5);
					UnityEditor.EditorGUILayout.HelpBox("Click the button to position the filter. This is useful if you want to create a filter that has 3D objects around or on the users head.",
						UnityEditor.MessageType.None);
					if (GUILayout.Button("Create Head Gizmo (Optional)", GUILayout.Height(32)))
					{
						var obj = new GameObject("Needle Filter Head Position");
						UnityEditor.Undo.RegisterCreatedObjectUndo(obj, "Create Face Filter Head Position");
						_headPosition = obj.AddComponent<FaceFilterHeadPosition>();
						obj.transform.SetParent((this.target as Component)!.transform, false);
						UnityEditor.Selection.activeObject = obj;
					}
				}
				else
				{
					GUILayout.Space(5);
					using (new GUILayout.HorizontalScope())
					{
						EditorGUILayout.PrefixLabel("Head Gizmo");
						using(new EditorGUI.DisabledScope(true))
							EditorGUILayout.ObjectField(_headPosition, typeof(FaceFilterHeadPosition), true);
					}
					EditorGUILayout.HelpBox("Use the Head Position Gizmo to position where your objects appear on or around a user's head/face. You can either move your objects to fit the gizmo or move/scale/rotate the gizmo to fit your model.",
						MessageType.None);
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

		[SerializeField] private Layout _layout = Layout.Mediapipe;

		public string layout
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
			if(isActiveAndEnabled)
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
				var target = (FaceMeshTexture)this.target;

				GUILayout.Space(3);
				switch (target._layout)
				{
					case Layout.Mediapipe:
						EditorGUILayout.TextArea(
							"Using the Mediapipe layout. Select this if your texture was created for Meta Spark or is using the <a href=\"https://spark.meta.com/learn/articles/creating-and-prepping-assets/the-face-mask-template-in-Adobe/\">Meta Spark template</a> or another tool that is using the ARCore face mesh tracking.",
							helpStyle);
						break;
					case Layout.Procreate:
						EditorGUILayout.HelpBox(
							"Using the Procreate layout. Select this if your texture was created using <a href=\"https://help.procreate.com/procreate/handbook/actions/actions-canvas#pz13yy3eihh\">Procreate's FacePaint feature</a> (or another iOS app that is using Apple ARKit Face Mesh tracking)",
							MessageType.None);
						break;
				}

				if (target.texture && target.texture == target.mask)
				{
					EditorGUILayout.HelpBox("The texture and mask are the same. Are you sure this is correct?", MessageType.Warning);
				}
			}
		}
#endif
	}

	[AddComponentMenu("Needle Engine/Face Filter/Face Mesh: Custom Shader (not supported yet)")]
	public partial class FaceMeshCustomShader
	{
		private void OnDrawGizmos()
		{
			Utils.RenderFaceGizmo(this);
		}
#if UNITY_EDITOR
		[UnityEditor.CustomEditor(typeof(FaceMeshCustomShader))]
		internal class Editor : UnityEditor.Editor
		{
			public override void OnInspectorGUI()
			{
				// base.OnInspectorGUI();
				EditorGUILayout.HelpBox("This feature is not yet supported", MessageType.Warning);
			}
		}
#endif
	}

	[AddComponentMenu("Needle Engine/Face Filter/Face Mesh: Video")]
	public partial class FaceMeshVideo
	{
	}
}