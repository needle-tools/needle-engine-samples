

// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

using System;
using System.Linq;
using UnityEditor;
using UnityEngine;

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class FaceBlendshapes : Needle.Typescript.GeneratedComponents.FaceBehaviour
	{
		public object @blendshapeMap;
		public void OnEnable(){}
		public void onResultUpdated(Needle.Typescript.GeneratedComponents.Facefilter @filter){}
	}
}

// NEEDLE_CODEGEN_END


namespace Needle.Typescript.GeneratedComponents
{
	public partial class FaceBlendshapes : Needle.Typescript.GeneratedComponents.FaceBehaviour
	{
		[CustomEditor(typeof(FaceBlendshapes))]
		internal class Editor : UnityEditor.Editor
		{
			private GUIStyle optionsStyle;

			public override void OnInspectorGUI()
			{
				base.OnInspectorGUI();
				// TODO: allow for remapping with a nice GUI
				
				EditorGUILayout.LabelField("Supported Blendshapes", EditorStyles.boldLabel);
				optionsStyle ??= new GUIStyle(EditorStyles.label);
				optionsStyle.wordWrap = true;
				optionsStyle.normal.textColor = Color.gray;
				EditorGUILayout.LabelField(string.Join(", ", supportedBlendshapeNames), optionsStyle);
			}
		}
		
		private static readonly string[] supportedBlendshapeNames = new[]
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


