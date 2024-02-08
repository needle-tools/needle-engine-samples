// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

using UnityEditor;

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
            var wasSceneDirty = gameObject.scene.isDirty;

            UnityEngine.AI.NavMeshTriangulation oldMesh = UnityEngine.AI.NavMesh.CalculateTriangulation();

            var anyData = oldMesh.vertices.Length > 1;

#if UNITY_EDITOR
            if (bakeNavmeshOnExport && (wasSceneDirty || anyData))
                UnityEditor.AI.NavMeshBuilder.BuildNavMesh();
#endif
            UnityEngine.AI.NavMeshTriangulation newMesh = UnityEngine.AI.NavMesh.CalculateTriangulation();

            //bool hasChanged = false;
            //if (oldMesh.vertices.Length != newMesh.vertices.Length)
            //    hasChanged = true;
            //else
            //{
            //    for (int i = 0; i < oldMesh.vertices.Length; i++)
            //    {
            //        var a = oldMesh.vertices[i];
            //        var b = newMesh.vertices[i];

            //        if (!VectorsApproximatelyEquel(a, b))
            //        {
            //            hasChanged = true;
            //            break;
            //        }
            //    }
            //}

            var mesh = new UnityEngine.Mesh();
            mesh.name = "ExportedNavMesh";
            for (int i = 0; i < newMesh.vertices.Length; i++)
            {
                var v3 = newMesh.vertices[i];
                //v3.x *= -1;
                newMesh.vertices[i] = v3;
            }
            mesh.vertices = newMesh.vertices;
            mesh.triangles = newMesh.indices;//.Reverse().ToArray();

            return mesh;
        }

        //bool VectorsApproximatelyEquel(UnityEngine.Vector3 a, UnityEngine.Vector3 b)
        //{
        //    return UnityEngine.Mathf.Approximately(a.x, b.x) &&
        //           UnityEngine.Mathf.Approximately(a.y, b.y) &&
        //           UnityEngine.Mathf.Approximately(a.z, b.z);
        //}
    }
}