using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Needle;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;

public class AssetChecks
{
    public class Samples
    {
        [Test]
        public void SampleModelsUseUnityGltfImporter() => ModelsUseUnityGltfImporter(SamplePackage);

        [Test]
        public void SampleModelsUseAllowedMaterials() => MaterialsUseAllowedShaders(SamplePackage);
            
        [Test]
        public void SampleShadersAreCorrect() => ShadersUseCorrectTargets(SamplePackage);
    }

    public class Engine
    {
        [Test]
        public void EngineModelsUseUnityGltfImporter() => ModelsUseUnityGltfImporter(EnginePackage);

        [Test]
        public void EngineModelsUseAllowedMaterials() => MaterialsUseAllowedShaders(EnginePackage);

        [Test]
        public void EngineShadersAreCorrect() => ShadersUseCorrectTargets(EnginePackage);
    }
    
    private const string samplePackageJsonGuid = "fd17907bb2ad1444d9c584fde3e7715b";
    private const string enginePackageJsonGuid = "041e32dc0df5f4641b30907afb5926e6";

    private static readonly string[] AllowedShaderNames = new string[]
    {
        "UnityGLTF/",
        "Hidden/UnityGLTF/",
        "Skybox/",
        "GUI/Text Shader",
        "Needle/Shadow Catcher",
        "VR/SpatialMapping/Occlusion",
    };

    private static readonly string[] AllowedMaterialGuids = new string[]
    {
        "e653836c30661fe419b8992e230ca189", // glow_add particle material - no good way to make a cross-platform additive material right now
        "0252d1a9babfab041b028d802c7ee9db", // also glow_add
    };

    private static bool MaterialIsAllowed(Material material)
    {
        if (!material || !material.shader) return false;

        // these are fine - they are known to export correctly.
        if (AllowedShaderNames.Any(shaderName => material.shader.name.StartsWith(shaderName)))
            return true;
        
        // some exceptions: these have cross-platform issues
        var guid = AssetDatabase.AssetPathToGUID(AssetDatabase.GetAssetPath(material));
        if (AllowedMaterialGuids.Contains(guid))
        {
            Debug.LogFormat(LogType.Warning, LogOption.NoStacktrace, material, "{0}", "Material is allowed but known to be problematic: " + material.name);
            return true;
        }

        // sub assets can pass; let's hope the respective importer can properly import this for different pipelines
        if (AssetDatabase.IsSubAsset(material)) 
            return true;
        
        // ShaderGraph is only allowed for custom conversions, other cases would need to be explicitly allowed
        var shaderAssetPath = AssetDatabase.GetAssetPath(material.shader);
        if (shaderAssetPath.EndsWith(".shadergraph"))
            return AssetDatabase.GetLabels(AssetImporter.GetAtPath(shaderAssetPath)).Contains("ExportShader");

        return false;
    }

    private static string SamplePackage => Path.GetDirectoryName(AssetDatabase.GUIDToAssetPath(samplePackageJsonGuid));
    private static string EnginePackage => Path.GetDirectoryName(AssetDatabase.GUIDToAssetPath(enginePackageJsonGuid));

    private static void ModelsUseUnityGltfImporter(string assetFolder)
    {
        // check if we have multiple valid glTF importers
        // load all model files in the folder where the asset for GUID packageJsonGuid is located
        // load via AssetDatabase.Find
        var modelFiles = AssetDatabase.FindAssets("t:GameObject", new[] { assetFolder });
        // iterate over model files and check if they use the correct importer (UnityGltf)
        foreach (var modelFile in modelFiles)
        {
            var modelPath = AssetDatabase.GUIDToAssetPath(modelFile);
            var importer = AssetImporter.GetAtPath(modelPath);
            var asset = AssetDatabase.LoadAssetAtPath<GameObject>(modelPath);
            
#if UNITY_2022_1_OR_NEWER
            var availableImporters = AssetDatabase.GetAvailableImporters(importer.assetPath);
#else
            var availableImporters = AssetDatabase.GetAvailableImporterTypes(importer.assetPath);
#endif
            if (availableImporters.Contains(typeof(UnityGLTF.GLTFImporter)))
            {
                var importerOverride = AssetDatabase.GetImporterOverride(importer.assetPath);
                if (importerOverride == null || importerOverride != typeof(UnityGLTF.GLTFImporter))
                {
#if UNITY_2022_1_OR_NEWER
                    if (importerOverride == null) continue; // Bug in 2022.1+: doesn't actually return the specified override, instead always returns null
#endif
                    Debug.LogError($"Model {Path.GetFileName(modelPath)} uses the wrong importer, should use " + typeof(UnityGLTF.GLTFImporter) + ". Uses: " + importer.GetType() + ". Override: " + importerOverride, asset);
                }
            }
            // Debug.Log(Path.GetFileName(importer.assetPath) + ", " + importer, importer);
        }
    }
    
    private static void MaterialsUseAllowedShaders(string assetFolder)
    {
        // find all materials in the same folder
        var materialFiles = AssetDatabase.FindAssets("t:Material", new[] { assetFolder });
        // iterate over material files and check if they use the correct shader (PBRGraph) or are subassets
        foreach (var materialFile in materialFiles)
        {
            var materialPath = AssetDatabase.GUIDToAssetPath(materialFile);
            var material = AssetDatabase.LoadAssetAtPath<Material>(materialPath);
            var isSubAsset = AssetDatabase.IsSubAsset(material);

            if (!MaterialIsAllowed(material))
            {
                Debug.LogError(Path.GetFileName(materialPath) + ", subasset: " + isSubAsset + ", shader: " + material.shader + ", guid: " + materialFile, material);
            }
        }
    }

    private static void ShadersUseCorrectTargets(string assetFolder)
    {
        var shaderFiles = AssetDatabase.FindAssets("t:Shader", new[] { assetFolder });
        var problems = new List<string>();
        Debug.Log($"Checking {shaderFiles.Length} shaders in {assetFolder}");
        foreach (var shaderFile in shaderFiles)
        {
            var shaderPath = AssetDatabase.GUIDToAssetPath(shaderFile);
            var shaderName = Path.GetFileNameWithoutExtension(shaderPath);
            if (!shaderPath.EndsWith(".shadergraph")) continue;
            
            var supportedTargets = ShaderGraphInternals.GetTargetsFromGraph(shaderPath);

            var hasAnyProblems = false;
            if (supportedTargets.BiRP != ShaderGraphInternals.TargetsInfo.TargetType.Unlit)
            {
                hasAnyProblems = true;
                problems.Add($"[BiRP] Shader \"{shaderName}\"\n    Expected: {ShaderGraphInternals.TargetsInfo.TargetType.Unlit}    Actual: {supportedTargets.BiRP}");
            }

            if (supportedTargets.URP != ShaderGraphInternals.TargetsInfo.TargetType.Unlit)
            {
                hasAnyProblems = true;
                problems.Add($"[URP]  Shader \"{shaderName}\"\n    Expected: {ShaderGraphInternals.TargetsInfo.TargetType.Unlit}    Actual: {supportedTargets.URP}");
            }
           
            if (hasAnyProblems)
                Debug.Log("Shader isn't configured correctly: " + shaderPath, AssetDatabase.LoadAssetAtPath<Shader>(shaderPath));
            
        }
        Assert.AreEqual(0, problems.Count, string.Join("\n", problems) + "\n\nProblems:");
    }

    // [Test]
    public void ScenesHaveNoMissingAssets()
    {
        // check with Missing Component info from parsed scene assets
    }
}
