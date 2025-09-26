using System.Collections.Generic;
using System.Linq;
using GLTF.Schema;
using Needle.Engine.Shaders;
using UnityEngine;
using UnityGLTF;
using UnityGLTF.Plugins;

namespace Needle.Terrain
{
    public class TarrainExporterContext : GLTFExportPluginContext
    {
        
        private List<UnityEngine.Terrain> _terrains = new List<UnityEngine.Terrain>();
        private List<GameObject> _convertedTerrains = new List<GameObject>();
        
        private TerrainExporterPlugin _plugin;
        private ExportContext _context;
        
        private List<Material> _terrainMaterials = new List<Material>();
        
        public TarrainExporterContext(ExportContext context, TerrainExporterPlugin plugin)
        {
            _context = context;
            _plugin = plugin;
        }

        public override void BeforeSceneExport(GLTFSceneExporter exporter, GLTFRoot gltfRoot)
        {
            var terrainComponents = exporter.RootTransforms
                .SelectMany(t => t.GetComponentsInChildren<UnityEngine.Terrain>()).Distinct().ToList();
            _terrains.AddRange(terrainComponents);
            foreach (var terrain in terrainComponents)
            {
                var go = terrain.gameObject;
                
                TerrainChunkExporter.ExportTerrainToChunks(
                    terrain,
                    _plugin.chunksX,
                    _plugin.chunksZ,
                    _plugin.maxVertsPerAxisPerChunk,
                    null,
                    out var newTerrain
                );
                if (go.transform.parent != null)
                    newTerrain.transform.parent = go.transform.parent;
                newTerrain.transform.SetPositionAndRotation(go.transform.position, go.transform.rotation);
                
                _convertedTerrains.Add(newTerrain);
                
                if (_plugin.exportMaterialXShader)
                    ShaderExporterRegistry.SetExportLabel(null, ShaderExporterRegistry.CustomShaderExportType.MaterialX);
                else
                {
                    ShaderExporterRegistry.SetExportLabel(null, ShaderExporterRegistry.CustomShaderExportType.None);
                    var renderers = newTerrain.GetComponentsInChildren<Renderer>();
                    var materials = renderers.Where(r => r.sharedMaterials != null).SelectMany(r => r.sharedMaterials);
                    _terrainMaterials.AddRange(materials);
                }
            }

        }
        
        public override void AfterSceneExport(GLTFSceneExporter exporter, GLTFRoot gltfRoot)
        {
            // foreach (var t in _convertedTerrains)
            //     SafeDestroy(t);
            //
            // _convertedTerrains.Clear();
        }

        public override bool BeforeMaterialExport(GLTFSceneExporter exporter, GLTFRoot gltfRoot, Material material, GLTFMaterial materialNode)
        {
            if (!_terrainMaterials.Contains(material))
                return false;

            var ext = new Needle_Terrain_Material();
            materialNode.AddExtension(Needle_Terrain_Material.EXTENSION_NAME, ext);
            exporter.DeclareExtensionUsage(Needle_Terrain_Material.EXTENSION_NAME);
            
            TextureInfo Export(string slot, GLTFSceneExporter.TextureExportSettings settings)
            {
                var t = material.GetTexture(slot);
                if (!t) return null;
                return exporter.ExportTextureInfoWithTextureTransform(material, t, slot, settings);
            }

            var normalExportSettings = exporter.GetExportSettingsForSlot(GLTFSceneExporter.TextureMapType.Normal);
            var baseColorExportSettings = exporter.GetExportSettingsForSlot(GLTFSceneExporter.TextureMapType.BaseColor);
            var splatMapExportSettings = exporter.GetExportSettingsForSlot(GLTFSceneExporter.TextureMapType.Linear);

            var splatmap = material.GetTexture("_SplatMap");
            if (splatmap)
                ext.splatMap = exporter.ExportTextureInfo(splatmap, splatmap.name, splatMapExportSettings);
            
            ext.baseMapR = Export("_BaseMap_R", baseColorExportSettings);
            ext.baseMapG = Export("_BaseMap_G", baseColorExportSettings);
            ext.baseMapB = Export("_BaseMap_B", baseColorExportSettings);
            ext.baseMapA = Export("_BaseMap_A", baseColorExportSettings);
            
            ext.normalMapR = Export("_NormalMap_R", normalExportSettings);
            ext.normalMapG = Export("_NormalMap_G", normalExportSettings);
            ext.normalMapB = Export("_NormalMap_B", normalExportSettings);
            ext.normalMapA = Export("_NormalMap_A", normalExportSettings);
            
            return true;
        }

        private static void SafeDestroy(Object o)
        {
            if (!o) return;
            if (Application.isPlaying)
                Object.Destroy(o);
            else
                Object.DestroyImmediate(o);
        }
    }
}