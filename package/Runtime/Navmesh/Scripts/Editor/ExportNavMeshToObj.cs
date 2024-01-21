using System.IO;
using System.Linq;
using System.Text;
using UnityEditor;
using UnityEditor.AI;
using UnityEngine;
using UnityEngine.AI;

// Obj exporter component based on: http://wiki.unity3d.com/index.php?title=ObjExporter

public class ExportNavMeshToObj : MonoBehaviour
{
    //[MenuItem("Custom/Export NavMesh to mesh")]
    public static string Export()
    {
        UnityEngine.AI.NavMeshTriangulation triangulatedNavMesh = UnityEngine.AI.NavMesh.CalculateTriangulation();

        Mesh mesh = new Mesh();
        mesh.name = "ExportedNavMesh";
        for (int i = 0; i < triangulatedNavMesh.vertices.Length; i++)
        {
            var v3 = triangulatedNavMesh.vertices[i];
            v3.x *= -1;
            triangulatedNavMesh.vertices[i] = v3;
        }
        mesh.vertices = triangulatedNavMesh.vertices;
        mesh.triangles = triangulatedNavMesh.indices.Reverse().ToArray();
        mesh.RecalculateNormals();
        //mesh.Optimize();

        var scenePath = EditorApplication.currentScene;
        var sceneName = Path.GetFileNameWithoutExtension(scenePath);
        var rootPath = Path.GetDirectoryName(scenePath);
        var folderPath = Path.Combine(rootPath, sceneName);
        var navmeshPath = Path.Combine(folderPath, $"{sceneName}_Navmesh.obj");

        TryCreateFolder(folderPath);
        MeshToFile(mesh, navmeshPath);

        //print("NavMesh exported as '" + navmeshPath + "'");
        AssetDatabase.Refresh();

        return navmeshPath;
    }

    static string MeshToString(Mesh mesh)
    {
        StringBuilder sb = new StringBuilder();

        sb.Append("g ").Append(mesh.name).Append("\n");
        foreach (Vector3 v in mesh.vertices)
        {
            sb.Append(string.Format("v {0} {1} {2}\n", v.x, v.y, v.z));
        }
        sb.Append("\n");
        foreach (Vector3 v in mesh.normals)
        {
            sb.Append(string.Format("vn {0} {1} {2}\n", v.x, v.y, v.z));
        }
        sb.Append("\n");
        foreach (Vector3 v in mesh.uv)
        {
            sb.Append(string.Format("vt {0} {1}\n", v.x, v.y));
        }
        for (int material = 0; material < mesh.subMeshCount; material++)
        {
            sb.Append("\n");
            //sb.Append("usemtl ").Append(mats[material].name).Append("\n");
            //sb.Append("usemap ").Append(mats[material].name).Append("\n");

            int[] triangles = mesh.GetTriangles(material);
            for (int i = 0; i < triangles.Length; i += 3)
            {
                sb.Append(string.Format("f {0}/{0}/{0} {1}/{1}/{1} {2}/{2}/{2}\n", triangles[i] + 1, triangles[i + 1] + 1, triangles[i + 2] + 1));
            }
        }
        return sb.ToString();
    }

    static void TryCreateFolder(string path)
    {
        if(!Directory.Exists(path))
            Directory.CreateDirectory(path);
    }

    static void MeshToFile(Mesh mesh, string filename)
    {
        using (StreamWriter sw = new StreamWriter(filename))
        {
            sw.Write(MeshToString(mesh));
        }
    }
}