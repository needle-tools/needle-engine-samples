using System.IO;
using UnityEditor;
using UnityEngine;

namespace Needle.Terrain
{
    public class TerrainExporter : MonoBehaviour
    {
        public UnityEngine.Terrain terrain;

        [Header("Chunking")]
        public int chunksX = 10;
        public int chunksZ = 10;

        public int maxVertsPerAxis = 65;      // Near
        
        [ContextMenu("Export Terrain Chunks")]
        public void Export()
        {
            if (terrain == null)
            {
                Debug.LogError("[TerrainTest] Assign a Terrain.");
                return;
            }

            if (chunksX < 1 || chunksZ < 1)
            {
                Debug.LogError("[TerrainTest] chunksX and chunksZ must be >= 1.");
                return;
            }
            
            string root = Path.Combine("Assets", terrain.name);
            Directory.CreateDirectory(root);
            
            TerrainChunkExporter.ExportTerrainToChunks(
                terrain,
                chunksX,
                chunksZ,
                maxVertsPerAxis,
                root,
                out var prefab
            );
            Debug.Log($"[TerrainTest] Export completed to '{root}'.");
        }
        
        [CustomEditor(typeof(TerrainExporter))]
        public class TerrainExporterEditor : Editor
        {
            public override void OnInspectorGUI()
            {
                base.OnInspectorGUI();
                
                var t = (TerrainExporter) target;
                if (!t.terrain)
                    return;
                if (GUILayout.Button("Bake Terrain"))
                {
                    t.Export();
                    t.terrain.gameObject.SetActive(false);
                }
            }
        }
    }
}