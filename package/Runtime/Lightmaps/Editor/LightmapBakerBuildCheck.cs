using System;
using System.Threading.Tasks;
using Needle.Engine.Core;
using Needle.Engine.Interfaces;
using UnityEditor;
using UnityEngine;
using Object = UnityEngine.Object;

namespace Needle.MultiLightmaps
{
    internal class LightmapBakerBuildCheck : IBuildStageCallbacks
    {
        public async Task<bool> OnBuild(BuildStage stage, ExportContext context)
        {
            if (stage == BuildStage.PreBuildScene)
            {
                var baker = Object.FindAnyObjectByType<LightmapBaker>();
                if (baker)
                {
                    try
                    {
                        // ensure that we have a lightmap baked for all configurations
                        for (var index = 0; index < baker.Configurations.Count; index++)
                        {
                            var conf = baker.Configurations[index];
                            if (!conf.BakedLightmap)
                            {
                                Debug.Log(
                                    $"Baking lightmap for configuration {index} \"{conf.Name}\" before exporting...",
                                    baker);
                                SceneView.lastActiveSceneView?.ShowNotification(
                                    new GUIContent("Baking lightmap " + conf.Name + "..."));
                                var res = await baker.BakeAsync(index);
                                if (!res)
                                    Debug.LogError(
                                        $"Baking lightmap configuration {index} failed. Please check the console for errors",
                                        baker);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Debug.LogError("Lightmap baking failed with an exception: " + ex, baker);
                    }
                }
            }

            return true;
        }
    }
}
