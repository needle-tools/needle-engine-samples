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
        public override void OnInspectorGUI()
        {
#if SPLINES_PACAKGE
            base.OnInspectorGUI();
#else
			UnityEngine.GUILayout.Label("TODO: instructions to install pacakge + VERSION CHECK");
#endif
		}
    }
}

#endif