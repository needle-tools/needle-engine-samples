#if !UNITY_2022_1_OR_NEWER || HAS_NAVMESH_PACKAGE
#define NAVMESH
#endif

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
#if UNITY_EDITOR && NAVMESH
            if (bakeNavmeshOnExport)
            {
                print("Baking <b><color=#0AA5C0>Nav Mesh</color></b> on export.");
                UnityEditor.AI.NavMeshBuilder.BuildNavMesh();
            }
#endif
#if NAVMESH
            UnityEngine.AI.NavMeshTriangulation newMesh = UnityEngine.AI.NavMesh.CalculateTriangulation();
#endif

            var mesh = new UnityEngine.Mesh();
#if NAVMESH
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

#if !NAVMESH
            UnityEditor.EditorGUILayout.HelpBox("Please install the Navigation Unity package.", UnityEditor.MessageType.Error);
            if(UnityEngine.GUILayout.Button("Open Package Manager"))
            {
                UnityEditor.PackageManager.UI.Window.Open("com.unity.ai.navigation");
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