using System.Threading.Tasks;
using Needle.Engine.Core;
using Needle.Engine.Interfaces;
using UnityEngine;

namespace Needle.MultiLightmaps
{
    internal class LightmapBakerBuildCheck : IBuildStageCallbacks
    {
        public async Task<bool> OnBuild(BuildStage stage, ExportContext context)
        {
            if (stage == BuildStage.PreBuildScene)
            {
                var baker = Object.FindObjectOfType<LightmapBaker>();
                if (baker)
                {
                    // ensure that we have a lightmap baked for all configurations
                    for (var index = 0; index < baker.Configurations.Count; index++)
                    {
                        var conf = baker.Configurations[index];
                        if (!conf.BakedLightmap)
                        {
                            Debug.Log("Baking lightmap for configuration " + conf.Name + " before exporting...");
                            await baker.BakeAsync(index);
                        }
                    }
                }
            }

            return true;
        }
    }
}
