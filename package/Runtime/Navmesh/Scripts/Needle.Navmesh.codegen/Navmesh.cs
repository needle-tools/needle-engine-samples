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
#if UNITY_EDITOR
            if (bakeNavmeshOnExport)
                UnityEditor.AI.NavMeshBuilder.BuildNavMesh();
#endif
            UnityEngine.AI.NavMeshTriangulation triangulatedNavMesh = UnityEngine.AI.NavMesh.CalculateTriangulation();

            var mesh = new UnityEngine.Mesh();
            mesh.name = "ExportedNavMesh";
            for (int i = 0; i < triangulatedNavMesh.vertices.Length; i++)
            {
                var v3 = triangulatedNavMesh.vertices[i];
                //v3.x *= -1;
                triangulatedNavMesh.vertices[i] = v3;
            }
            mesh.vertices = triangulatedNavMesh.vertices;
            mesh.triangles = triangulatedNavMesh.indices;//.Reverse().ToArray();

            return mesh;
        }
    }
}