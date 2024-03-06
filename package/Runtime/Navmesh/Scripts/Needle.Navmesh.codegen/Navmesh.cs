// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class Navmesh : UnityEngine.MonoBehaviour
	{
		public void awake(){}
	}
}

// NEEDLE_CODEGEN_END

namespace Needle.Typescript.GeneratedComponents
{
    public partial class Navmesh : UnityEngine.MonoBehaviour
    {
        public bool bakeNavmeshOnExport = true;
        public UnityEngine.Mesh navMesh => GetMesh();

        UnityEngine.Mesh GetMesh()
        {
#if UNITY_EDITOR && HAS_NAVMESH_PACKAGE
            if (bakeNavmeshOnExport)
            {
                print("Baking <b><color=#0AA5C0>Nav Mesh</color></b> on export.");
                UnityEditor.AI.NavMeshBuilder.BuildNavMesh();
            }
#endif
#if HAS_NAVMESH_PACKAGE
            UnityEngine.AI.NavMeshTriangulation newMesh = UnityEngine.AI.NavMesh.CalculateTriangulation();
#endif

            var mesh = new UnityEngine.Mesh();
#if HAS_NAVMESH_PACKAGE
            mesh.name = "ExportedNavMesh";
            mesh.vertices = newMesh.vertices;
            mesh.triangles = newMesh.indices;
#endif
            return mesh;
        }
    }
}

#if UNITY_EDITOR
namespace Needle.Typescript.GeneratedComponents
{
    [UnityEditor.CustomEditor(typeof(Navmesh)), UnityEditor.CanEditMultipleObjects]
    public class NavmeshEditor : UnityEditor.Editor
    {
        public override void OnInspectorGUI()
        {
            base.OnInspectorGUI();

#if !HAS_NAVMESH_PACKAGE
            UnityEditor.EditorGUILayout.HelpBox("Please install the Navigation Unity package.", UnityEditor.MessageType.Error);
            if(UnityEngine.GUILayout.Button("Open Package Manager"))
            {
#if !UNITY_2022_1_OR_NEWER
                UnityEditor.PackageManager.UI.Window.Open("com.unity.modules.ai");
#else
                UnityEditor.PackageManager.UI.Window.Open("com.unity.ai.navigation");
#endif
            }
#else
            if (UnityEngine.GUILayout.Button("Open Navigation Baker"))
            {
                UnityEditor.EditorApplication.ExecuteMenuItem("Window/AI/Navigation");
            }
#endif
        }
    }
}
#endif