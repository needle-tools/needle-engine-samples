using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace Needle.Terrain
{

    internal static class TerrainChunkExporter
    {
        private static Texture2D DuplicateToPowerOf2Texture(Texture2D source)
        {
            float height = source.height;
            float width = source.width;
            int newWidth = Mathf.NextPowerOfTwo(source.width);
            int newHeight = Mathf.NextPowerOfTwo(source.height);
            
            // Safe duplication regardless of source readability.
            var rt = RenderTexture.GetTemporary(newWidth, newHeight, 0, RenderTextureFormat.ARGB32,
                RenderTextureReadWrite.Linear);
            Graphics.Blit(source, rt);

            var prev = RenderTexture.active;
            RenderTexture.active = rt;
            
            var copy = new Texture2D(newWidth, newHeight, TextureFormat.RGBA32, source.mipmapCount > 1, true);
            copy.ReadPixels(new Rect(0, 0, newWidth, newHeight), 0, 0);
            copy.Apply(false, false);

            RenderTexture.active = prev;
            RenderTexture.ReleaseTemporary(rt);
            copy.wrapMode = source.wrapMode;
            copy.filterMode = source.filterMode;
            copy.anisoLevel = source.anisoLevel;
            return copy;
        }

        public static void ExportTerrainToChunks(
            UnityEngine.Terrain terrain,
            int chunksX,
            int chunksZ,
            int maxVertsPerAxis,
            string outputRoot,
            out GameObject prefab)
        {
            var data = terrain.terrainData;
            Vector3 tPos = terrain.transform.position;
            Vector3 tSize = data.size;
            
            chunksX = Mathf.Max(1, Mathf.RoundToInt(terrain.terrainData.size.x / 100f * chunksX));
            chunksZ = Mathf.Max(1, Mathf.RoundToInt(terrain.terrainData.size.z / 100f * chunksZ));
            
            // Clamp and sanity
            maxVertsPerAxis = Mathf.Max(2, maxVertsPerAxis);

            prefab = new GameObject();
            Material terrainMat = new Material(Shader.Find("Shader Graphs/SimpleTerrain"));
            terrainMat.name = "TerrainMaterial";
            prefab.name = "Terrain";

            GameObject parentAsset = null;
            string prefabPath = null;
            if (outputRoot != null)
            {
                string root = Path.Combine("Assets", terrain.name);
                Directory.CreateDirectory(root);

                prefabPath = Path.Combine(outputRoot, "terrain.prefab");
                if (AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath) != null)
                    AssetDatabase.DeleteAsset(prefabPath);
                
                Directory.CreateDirectory(outputRoot);
                PrefabUtility.SaveAsPrefabAssetAndConnect(prefab, prefabPath, InteractionMode.AutomatedAction);
                parentAsset = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
            }

            var layers = data.terrainLayers;

            Texture2D[] baseMaps = new Texture2D[layers.Length];
            Texture2D[] normalMaps = new Texture2D[layers.Length];
            
            int index = 0;
            string[] channel = new string[] { "R", "G", "B", "A" };
            foreach (var layer in layers)
            {
                if (index >= channel.Length) break;
                
                var channelMap = $"_BaseMap_{channel[index]}";
                var channelNormalMap = $"_NormalMap_{channel[index]}";
                terrainMat.SetTexture(channelMap, layer.diffuseTexture);
                terrainMat.SetTextureOffset(channelMap, layer.tileOffset);
                terrainMat.SetTextureScale(channelMap, layer.tileSize);
                terrainMat.SetTexture(channelNormalMap, layer.normalMapTexture);
                terrainMat.SetTextureOffset(channelNormalMap, layer.tileOffset);
                terrainMat.SetTextureScale(channelNormalMap, layer.tileSize);

                baseMaps[index] = layer.diffuseTexture;
                normalMaps[index] = layer.normalMapTexture;
                index++;
            }
            
            var childrens = new List<GameObject>();
            for (int cz = 0; cz < chunksZ; cz++)
            {
                for (int cx = 0; cx < chunksX; cx++)
                {
                    // Chunk bounds in normalized terrain space [0..1]
                    float u0 = (float)cx / chunksX;
                    float v0 = (float)cz / chunksZ;
                    float u1 = (float)(cx + 1) / chunksX;
                    float v1 = (float)(cz + 1) / chunksZ;

                    var relativeChunkCenter = new Vector3(
                        (u0 + u1) / 2 * tSize.x + tPos.x,
                        0,
                        (v0 + v1) / 2 * tSize.z + tPos.z
                    );

                    Mesh mesh = BuildChunkMesh(data, -relativeChunkCenter, tSize, u0, v0, u1, v1, maxVertsPerAxis,
                        maxVertsPerAxis);

                    string baseName = $"chunk_{cx:D2}_{cz:D2}";
                    mesh.name = baseName;
                    
                    if (parentAsset != null)
                        AssetDatabase.AddObjectToAsset(mesh, parentAsset);

                    // Export per-chunk splatmaps (control maps)
                    ExportChunkSplatmaps(data, u0, v0, u1, v1, baseName, parentAsset, out Texture2D splatMap);

                    var go = new GameObject(baseName);
                    go.transform.position = tPos + relativeChunkCenter;
                    go.transform.rotation = Quaternion.identity;
                    go.transform.localScale = Vector3.one;
                    go.transform.SetParent(prefab.transform, false);
                    var mf = go.AddComponent<MeshFilter>();
                    mf.sharedMesh = mesh;
                    var mr = go.AddComponent<MeshRenderer>();
                    var mat = new Material(terrainMat);
                    mat.name = baseName;
                    var meshCollider = go.AddComponent<MeshCollider>();
                    meshCollider.sharedMesh = mesh;
                    
                    var chunkComp = go.AddComponent<TerrainChunk>();
                    chunkComp.baseMaps = baseMaps;
                    chunkComp.normalMaps = normalMaps;
                    chunkComp.splatMap = splatMap;
                    chunkComp.offset = new Vector2[layers.Length];
                    chunkComp.tiling = new Vector2[layers.Length];

                    // Per-chunk tiling/offset to match Terrain UVs:
                    // uv = (worldPosXZ + tileOffset) / tileSize
                    // With mesh uv0 = [0..1] across the chunk, set:
                    // scale.x = ((u1 - u0) * tSize.x) / tileSize.x
                    // offset.x = (tPos.x + u0 * tSize.x + tileOffset.x) / tileSize.x
                    // (same for z/y)
                    int li = 0;
                    foreach (var layer in layers)
                    {
                        if (li >= channel.Length) break;

                        var tileSize = layer.tileSize;
                        var tileOffset = layer.tileOffset;

                        float tsx = Mathf.Abs(tileSize.x) < 1e-6f ? 1f : tileSize.x;
                        float tsy = Mathf.Abs(tileSize.y) < 1e-6f ? 1f : tileSize.y;

                        var scale = new Vector2(
                            ((u1 - u0) * tSize.x) / tsx,
                            ((v1 - v0) * tSize.z) / tsy
                        );
                        var offset = new Vector2(
                            (tPos.x + u0 * tSize.x + tileOffset.x) / tsx,
                            (tPos.z + v0 * tSize.z + tileOffset.y) / tsy
                        );

                        var channelMap = $"_BaseMap_{channel[li]}";
                        var channelNormalMap = $"_NormalMap_{channel[li]}";
                        mat.SetTextureScale(channelMap, scale);
                        mat.SetTextureOffset(channelMap, offset);
                        mat.SetTextureScale(channelNormalMap, scale);
                        mat.SetTextureOffset(channelNormalMap, offset);
                        chunkComp.tiling[li] = scale;
                        chunkComp.offset[li] = offset;
                        li++;
                    }

                    mat.SetTexture("_SplatMap", splatMap);
                    
                    if (parentAsset != null)
                        AssetDatabase.AddObjectToAsset(mat, parentAsset);
                    
                    mr.sharedMaterial = mat;
                    childrens.Add(go);

                }
            }

            if (parentAsset != null)
                PrefabUtility.ApplyAddedGameObjects(childrens.ToArray(), prefabPath, InteractionMode.AutomatedAction);
        }

        private static Mesh BuildChunkMesh(
            TerrainData data,
            Vector3 tPos,
            Vector3 tSize,
            float u0, float v0, float u1, float v1,
            int vertsX, int vertsZ)
        {
            int vx = vertsX;
            int vz = vertsZ;
            int vertCount = vx * vz;
            int quadCount = (vx - 1) * (vz - 1);

            var vertices = new Vector3[vertCount];
            var normals = new Vector3[vertCount];
            var uvs = new Vector2[vertCount];
            var indices = new int[quadCount * 6];

            int vi = 0;
            for (int z = 0; z < vz; z++)
            {
                float tz = vz > 1 ? (float)z / (vz - 1) : 0f;
                float v = Mathf.Lerp(v0, v1, tz);
                for (int x = 0; x < vx; x++, vi++)
                {
                    float tx = vx > 1 ? (float)x / (vx - 1) : 0f;
                    float u = Mathf.Lerp(u0, u1, tx);

                    float h = data.GetInterpolatedHeight(u, v);
                    Vector3 pos = new Vector3(
                        tPos.x + u * tSize.x,
                        tPos.y + h,
                        tPos.z + v * tSize.z
                    );
                    Vector3 n = data.GetInterpolatedNormal(u, v);

                    vertices[vi] = pos;
                    normals[vi] = n;
                    uvs[vi] = new Vector2(tx, tz);
                }
            }

            int ii = 0;
            for (int z = 0; z < vz - 1; z++)
            {
                for (int x = 0; x < vx - 1; x++)
                {
                    int i0 = z * vx + x;
                    int i1 = i0 + 1;
                    int i2 = i0 + vx;
                    int i3 = i2 + 1;

                    // Triangle 1
                    indices[ii++] = i0;
                    indices[ii++] = i2;
                    indices[ii++] = i1;

                    // Triangle 2
                    indices[ii++] = i1;
                    indices[ii++] = i2;
                    indices[ii++] = i3;
                }
            }

            var mesh = new Mesh
            {
                indexFormat = (vertCount > 65000)
                    ? UnityEngine.Rendering.IndexFormat.UInt32
                    : UnityEngine.Rendering.IndexFormat.UInt16
            };
            mesh.SetVertices(vertices);
            mesh.SetNormals(normals);
            mesh.SetUVs(0, uvs);
            mesh.SetTriangles(indices, 0);
            mesh.RecalculateBounds();
            return mesh;
        }

        private static void ExportChunkSplatmaps(
            TerrainData data,
            float u0, float v0, float u1, float v1,
            string baseName, GameObject parentAsset, out Texture2D tex)
        {
            const int maxLayers = 4;
            tex = null;
            int alphaRes = data.alphamapResolution;
            int layers = data.alphamapLayers;
            if (layers <= 0) return;
            layers = Mathf.Min(layers, maxLayers);

            // Compute pixel rect in alphamap space
            int x0 = Mathf.Clamp(Mathf.FloorToInt(u0 * (alphaRes - 1)), 0, alphaRes - 1);
            int z0 = Mathf.Clamp(Mathf.FloorToInt(v0 * (alphaRes - 1)), 0, alphaRes - 1);
            int x1 = Mathf.Clamp(Mathf.CeilToInt(u1 * (alphaRes - 1)), 0, alphaRes - 1);
            int z1 = Mathf.Clamp(Mathf.CeilToInt(v1 * (alphaRes - 1)), 0, alphaRes - 1);
            int w = Mathf.Max(1, x1 - x0 + 1);
            int h = Mathf.Max(1, z1 - z0 + 1);

            float[,,] alpha = data.GetAlphamaps(x0, z0, w, h);

            w = Mathf.Min(w, alpha.GetLength(0));
            h = Mathf.Min(h, alpha.GetLength(1));

            int maps = Mathf.CeilToInt(layers / 4f);
            var mapPixels = new Color[maps][];
            for (int m = 0; m < maps; m++)
                mapPixels[m] = new Color[w * h];

            for (int zz = 0; zz < h; zz++)
            {
                for (int xx = 0; xx < w; xx++)
                {
                    int p = zz * w + xx;
                    for (int layer = 0; layer < layers; layer++)
                    {
                        int mapIndex = layer / 4;
                        int ch = layer % 4;
                        float val = alpha[zz, xx, layer];

                        Color c = mapPixels[mapIndex][p];
                        switch (ch)
                        {
                            case 0: c.r = val; break;
                            case 1: c.g = val; break;
                            case 2: c.b = val; break;
                            case 3: c.a = val; break;
                        }

                        mapPixels[mapIndex][p] = c;
                    }
                }
            }

            for (int m = 0; m < maps; m++)
            {
                var texTemp = new Texture2D(w, h, TextureFormat.RGBA32, false, true);
                texTemp.wrapMode = TextureWrapMode.Clamp;
                texTemp.SetPixels(mapPixels[m]);
                texTemp.name = baseName;
                texTemp.Apply(false, false);

                tex = DuplicateToPowerOf2Texture(texTemp);
                tex.Apply(false, false);
                Object.DestroyImmediate(texTemp);
                tex.name = baseName;
                tex.wrapMode = TextureWrapMode.Clamp;
                
                if (parentAsset != null)
                    AssetDatabase.AddObjectToAsset(tex, parentAsset);
            }
        }

    }
}