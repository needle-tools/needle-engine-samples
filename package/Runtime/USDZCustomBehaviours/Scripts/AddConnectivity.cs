using System;
using System.Collections.Generic;
using System.Linq;
using Needle.Engine.Components;
using UnityEngine;
#if UNITY_EDITOR
using UnityEditor;
#endif

namespace Needle
{
    public class AddConnectivity : MonoBehaviour
    {
        [Tooltip("Will not be hidden on start")]
        public List<GameObject> startPoints = new List<GameObject>();
        public Material defaultMat;
        [Tooltip("Lower > less faces will be detected / less click targets")]
        public float normalHashMultiplier = 100f;
        
        private List<GameObject> roots = new List<GameObject>();
        
        [ContextMenu("Set up")]
        internal void SetupAll()
        {
            var temporaryMeshColliders = new List<Collider>();
            roots.Clear();
            generatedMeshes.Clear();
            var c = transform.childCount;
            for (var i = 0; i < c; i++)
            {
                var go = transform.GetChild(i).gameObject;
                roots.Add(go); 
                // check if mc
                var mc = go.GetComponent<MeshCollider>();
                if (!mc)
                {
                    mc = go.AddComponent<MeshCollider>();
                    temporaryMeshColliders.Add(mc);
                    mc.sharedMesh = go.GetComponent<MeshFilter>().sharedMesh;
                    mc.convex = true;
                }
            }

            for (var i = 0; i < c; i++)
            {
                var child = this.transform.GetChild(i);
                Setup(child.gameObject);
            }
            
            // remove mesh colliders again
            foreach (var tempCollider in temporaryMeshColliders)
            {
                DestroyImmediate(tempCollider);
            }
            
            generatedMeshes.Clear();
        }

        [ContextMenu("Clear")]
        internal void ClearAll()
        {
            var c = transform.childCount;
            for (var i = 0; i < c; i++)
            {
                var child = this.transform.GetChild(i);
                Clear(child.gameObject);
            }
            roots.Clear();
            generatedMeshes.Clear();
        }

        void Clear(GameObject root)
        {
            var components = root.GetComponentsInChildren<Component>();
            foreach (var c in components)
            {
                // created face colliders
                if (c is Transform && c.name.StartsWith("Face ", StringComparison.Ordinal)) {
                    DestroyImmediate(c.gameObject);
                    continue;
                }
                
                // created components
                if (c is HideOnStart || c is SetActiveOnClick)
                    DestroyImmediate(c);
            }
        }
        
        Dictionary<(Mesh, int), Mesh> generatedMeshes = new Dictionary<(Mesh, int), Mesh>();

        int ListHashCode<T>(List<T> list)
        {
            int res = 0x2D2816FE;
            foreach(var item in list)
                res = res * 31 + (item == null ? 0 : item.GetHashCode());
            return res;
        }

        void Setup(GameObject root)
        {
            // remove all child components we added before that are not transforms or meshrenderer or meshfilter
            // start with child closest to (0,0,0)
            // add ShowOnClick and show random connected one
            // continue from that and keep showing more items until we run out of connectivity.
            
            // future: find coplanar faces from meshes (can be children? added in Blender?) and show the relevant connected piece from there

            Clear(root);
            
            // add HideOnStart component
            if (!startPoints.Contains(root))
                root.AddComponent<HideOnStart>();

            var mesh = root.GetComponent<MeshFilter>().sharedMesh;
            
            // sort triangles by normal direction
            var tris = new List<int>(mesh.triangles);
            var normals = new List<Vector3>(mesh.normals);
            var verts = new List<Vector3>(mesh.vertices);
            var uv = new List<Vector2>(mesh.uv);
            var trisByNormal = new Dictionary<int, List<int>>();
            
            int NormalToSomeHeuristicIndex(Vector3 normal)
            {
                return Mathf.RoundToInt(normal.x * normalHashMultiplier).GetHashCode() ^
                       Mathf.RoundToInt(normal.y * normalHashMultiplier).GetHashCode() << 2 ^
                       Mathf.RoundToInt(normal.z * normalHashMultiplier).GetHashCode() >> 2;
            }
            
            for (var i = 0; i < tris.Count; i += 3)
            {
                var avgNormal = (normals[tris[i]] + normals[tris[i + 1]] + normals[tris[i + 2]]) / 3f;
                var hash = NormalToSomeHeuristicIndex(avgNormal);
                if (!trisByNormal.ContainsKey(hash))
                    trisByNormal.Add(hash, new List<int>());
             
                // add all three indices
                trisByNormal[hash].Add(tris[i]);
                trisByNormal[hash].Add(tris[i+1]);
                trisByNormal[hash].Add(tris[i+2]);
            }
            
            // Log
            // foreach (var pair in trisByNormal)
            // {
                // Debug.Log("Normal: " + normals[pair.Value[0]] + " (" + pair.Value.Count / 3 + " triangles)");
            // }
            
            // create new meshes for the faces
            var newMeshes = new List<Mesh>();
            int k = 0;
            foreach (var kvp in trisByNormal)
            {
                var trisForNormal = kvp.Value;
                var lookup = (mesh, ListHashCode(trisForNormal));
                
                // check if we have this particular mesh already
                if (!generatedMeshes.TryGetValue(lookup, out var newMesh))
                {
                    newMesh = new Mesh();
                    newMeshes.Add(newMesh); 
                    newMesh.vertices = trisForNormal.ConvertAll(v => verts[v]).ToArray();
                    newMesh.normals = trisForNormal.ConvertAll(v => normals[v]).ToArray();
                    newMesh.uv = trisForNormal.ConvertAll(v => uv[v]).ToArray();
                    // set indices, just ordered indices for them
                    var indices = new int[trisForNormal.Count];
                    for (var j = 0; j < indices.Length; j++)
                        indices[j] = j;
                    newMesh.triangles = indices;
                    newMesh.RecalculateNormals();
                    newMesh.RecalculateBounds();
                    
                    generatedMeshes.Add(lookup, newMesh);
                }

                // add as child
                var go = new GameObject("Face " + k++);
                go.transform.SetParent(root.transform);
                go.transform.localPosition = Vector3.zero;
                go.transform.localRotation = Quaternion.identity;
                go.transform.localScale = Vector3.one * 1.008f; // push outwards a little
                go.AddComponent<MeshFilter>().sharedMesh = newMesh;
                go.AddComponent<MeshRenderer>().sharedMaterial = defaultMat;
                // go.hideFlags = HideFlags.DontSave;
                
                var faceCenter = Vector3.zero;
                foreach (var v in newMesh.vertices)
                    faceCenter += v;
                faceCenter /= newMesh.vertices.Length;
                
                // find overlap with mesh colliders
                var overlaps = new List<Collider>();
                var mc = root.GetComponent<MeshCollider>();
                // transform faceCenter to world
                faceCenter = root.transform.TransformPoint(faceCenter);
                var overlapping = Physics.OverlapSphere(faceCenter, 0.02f);
                
                foreach (var overlap in overlapping)
                {
                    if (overlap == mc) continue;
                    overlaps.Add(overlap);
                }
                
                if (overlaps.Count == 0)
                {
                    // Debug.LogWarning("No overlap found for face " + k);
                    DestroyImmediate(go);
                    continue;
                }
                
                // there 'should' be only one overlap, but we'll just take the first one
                var randomRoot = overlaps[0].gameObject;
                
                // add ShowOnClick component
                
                // var randomSelection = Random.Range(0, roots.Count);
                // var randomRoot = roots[randomSelection];
                
                var showOnClick = go.AddComponent<SetActiveOnClick>();
                showOnClick.toggleOnClick = false;
                showOnClick.hideSelf = false;
                showOnClick.targetState = true;
                showOnClick.target = randomRoot.transform;
                
                // find connected 3D object - basically the one that has the closest face center point AND flipped normal direction
                
            }
        }
    }
    
    #if UNITY_EDITOR

    [CustomEditor(typeof(AddConnectivity))]
    internal class AddConnectivityEditor : Editor
    {
        public int childCount = 0;
        public int hideOnStartCount = 0;
        public int setActiveOnClickCount = 0;

        private void OnEnable()
        {
            var t = target as AddConnectivity;
            childCount = t.transform.childCount;
            hideOnStartCount = t.transform.GetComponentsInChildren<HideOnStart>().Length;
            setActiveOnClickCount = t.transform.GetComponentsInChildren<SetActiveOnClick>().Length;
        }

        public override void OnInspectorGUI()
        {
            var t = target as AddConnectivity;
            if (!t) return;
            
            EditorGUILayout.HelpBox("This component scans all child meshes and creates \"connectivity surfaces\" for them. Each such surface will reveal the object it's connected to on click.", MessageType.Info);
            
            if (GUILayout.Button("Create Connectivity"))
            {
                t.SetupAll();
                OnEnable();
            }

            if (GUILayout.Button("Clear Connectivity"))
            {
                t.ClearAll();
                OnEnable();
            }
            EditorGUILayout.Space();
            
            GUILayout.Label("Statistics", EditorStyles.boldLabel);
            GUI.enabled = false; 
            EditorGUILayout.LabelField("Child Count", childCount.ToString());
            EditorGUILayout.LabelField("Hidden Objects", hideOnStartCount.ToString());
            EditorGUILayout.LabelField("Clickable Faces", setActiveOnClickCount.ToString());
            GUI.enabled = true;
            EditorGUILayout.Space();
            
            GUILayout.Label("Settings", EditorStyles.boldLabel); 
            DrawDefaultInspector();
        }
    }
    
    #endif
}
