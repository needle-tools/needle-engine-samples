using Needle.Typescript.GeneratedComponents;
using System.Collections;
using System.Collections.Generic;
using UnityEditor;
using UnityEditor.AI;
using UnityEngine;

[CustomEditor(typeof(Navmesh))]
public class NavmeshEditor : Editor
{
    public override void OnInspectorGUI()
    {
        if (GUILayout.Button("Generate Navmesh"))
        {
            NavMeshBuilder.BuildNavMesh();
            var path = ExportNavMeshToObj.Export();
            var navmeshObj = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            addToScene(navmeshObj);

            var comp = target as Navmesh;
            comp.transform.position = Vector3.zero;
            comp.transform.rotation = Quaternion.identity;
            comp.transform.localScale = Vector3.one;
        }
    }

    void addToScene(GameObject obj)
    {
        if (obj == null) return;

        var navmesh = target as Navmesh;
        if (navmesh == null) return;

        var navmeshProp = serializedObject.FindProperty(nameof(navmesh.navMesh));

        if (!navmesh.navMesh)
        {
            var newObj = Instantiate(obj, navmesh.transform);
            newObj.name = obj.name;
            var renderer = newObj.GetComponentInChildren<MeshRenderer>();
            if (renderer != null)
            {
                navmeshProp.objectReferenceValue = renderer.gameObject;
                renderer.gameObject.SetActive(false);
                renderer.receiveShadows = false;
                renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            }
        }

        serializedObject.ApplyModifiedPropertiesWithoutUndo();
    }
}
