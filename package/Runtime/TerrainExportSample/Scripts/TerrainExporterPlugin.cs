using UnityEngine;
using UnityGLTF;
using UnityGLTF.Plugins;

namespace Needle.Terrain
{
    public class TerrainExporterPlugin : GLTFExportPlugin
    {
        
        [Header("Chunking per 100m")]
        public int chunksX = 5;
        public int chunksZ = 5;

        [Header("Geometry Resolution")]
        public int maxVertsPerAxisPerChunk = 65;

        [Header("Material")]
        [Tooltip("If enabled, the SimpleTerrain shader will be exported as MaterialX. MaterialsX has currently some limitations, e.g. no shadows. Also the loading time is much higher.")]
        public bool exportMaterialXShader = false;
        
        public override string DisplayName
        {
            get => "Terrain Exporter (Editor Only)";
        }
        
        public override string Description
        {
            get => "Exports Unity Terrain components.";
        }

        public override bool EnabledByDefault { get; } = true;
        
        public override GLTFExportPluginContext CreateInstance(ExportContext context)
        {
            return new TarrainExporterContext(context, this);
        }
    }
}