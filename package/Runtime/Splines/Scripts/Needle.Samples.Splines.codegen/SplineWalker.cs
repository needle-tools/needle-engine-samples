// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class SplineWalker : UnityEngine.MonoBehaviour
	{
		public UnityEngine.GameObject @object;
		public float @position01;
		public UnityEngine.GameObject @lookAt;
		public bool @clamp = false;
		public void start(){}
	}
}

// NEEDLE_CODEGEN_END

#if SPLINES_PACAKGE

namespace Needle.Typescript.GeneratedComponents
{
	public partial class SplineWalker : UnityEngine.MonoBehaviour
	{
		public UnityEngine.Splines.SplineContainer @spline;
    }
}

#endif

#if UNITY_EDITOR

namespace Needle.Typescript.GeneratedComponents
{
	[UnityEditor.CustomEditor(typeof(SplineWalker))]
    public class SplineWalkerEdiotr : UnityEditor.Editor
	{
		UnityEngine.GUIStyle labelSkin;
        public override void OnInspectorGUI()
        {
#if SPLINES_PACAKGE
            base.OnInspectorGUI();
#elif !UNITY_2022_1_OR_NEWER
			if (labelSkin == null)
			{
                labelSkin = new UnityEngine.GUIStyle(UnityEditor.EditorStyles.boldLabel);
				labelSkin.normal.textColor = new UnityEngine.Color(0.77f, 0.29f, 0.29f);
            }

			UnityEngine.GUILayout.Label("Splines pacakge requires Unity 2022.3+", labelSkin);
#else
			if (UnityEngine.GUILayout.Button("Install Splines package")) {
				UnityEditor.PackageManager.UI.Window.Open("com.unity.splines");
			}
#endif
        }
    }
}

#endif