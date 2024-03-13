using Needle.Engine;
using Needle.Engine.ProjectBundle;
using NUnit.Framework;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Player;
using Actions = Needle.Engine.Actions;
using Task = System.Threading.Tasks.Task;

namespace Compilation
{
    internal class _01_CompilationChecks
    {
        [Test, Category(SampleChecks.SampleChecks.CodeCategoryName)]
        public void BuildTargetCompiles([ValueSource(nameof(GetTestBuildTargets))] BuildTarget buildTarget)
        {
            var settings = new ScriptCompilationSettings
            {
                group = BuildPipeline.GetBuildTargetGroup(buildTarget),
                target = buildTarget,
                options = ScriptCompilationOptions.None
            };

            PlayerBuildInterface.CompilePlayerScripts(settings, TempDir + "_" + buildTarget);
        }

        private const string TempDir = "Temp/PlayerScriptCompilationTests";

        private static IEnumerable<BuildTarget> GetTestBuildTargets()
        {
            yield return BuildTarget.StandaloneWindows64;
        }

        /*
        private static IEnumerable<BuildTarget> GetAllBuildTargets()
        {
            return Enum.GetValues(typeof(BuildTarget))
                .Cast<BuildTarget>()
                .Where(x => GetAttributeOfType<ObsoleteAttribute>(x) == null)
                .Except(new [] { BuildTarget.WSAPlayer, BuildTarget.NoTarget }); // excluded because they have errors even with just Unity packages.
        }

        private static T GetAttributeOfType<T>(Enum enumVal) where T:Attribute
        {
            var memInfo = enumVal.GetType().GetMember(enumVal.ToString());
            var attributes = memInfo[0].GetCustomAttributes(typeof(T), false);
            return attributes.Length > 0 ? (T) attributes[0] : null;
        }
        */

        // --- TypeScript -----

        internal static List<BundleData> GetModules()
        {
            return AssetDatabase.FindAssets("t:npmdefobject")
                .Select(AssetDatabase.GUIDToAssetPath)
                .Where(path => path.Contains("com.needle.engine-samples"))
                .Select(path => 
                {
                    Bundle.TryGetFromPath(path, out var bundle); 
                    return bundle; 
                })
                .Where(x => x != null)
                .Select(x => new BundleData(x))
                .ToList();
        }

        internal static List<WebProjectData> GetWebProjects()
        {
            // find all scenes in Samples
            var allScenes = AssetDatabase.FindAssets("t:scene", new [] { AssetChecks.SamplePackage })
                .Select(AssetDatabase.GUIDToAssetPath)
                .ToList();
            
            return allScenes
                .Select(x => new WebProjectData(x, null))
                .ToList();
        }
    }

    /// <summary>
    /// Wrapper class to display Bundle name in the Test Runner
    /// </summary>
    internal class BundleData
    {
        public Bundle Bundle;
        public override string ToString()
        {
            return Bundle.Name;
        }
        public BundleData(Bundle bundle) => this.Bundle = bundle;
    }

    [TestFixtureSource(typeof(_01_CompilationChecks), nameof(_01_CompilationChecks.GetModules))]
    internal class _03_NpmDefs
    {
        readonly BundleData bundleData;
        Bundle bundle => bundleData.Bundle;
        public _03_NpmDefs(BundleData data)
        {
            bundleData = data;            
        }
        
        [Test, Category(SampleChecks.SampleChecks.CodeCategoryName)]
        public async Task Compiles()
        {
            var path = bundle.PackageFilePath;
            path = Path.GetDirectoryName(path);
            Assert.IsTrue(await bundle.RunInstall(), $"Failed to install: {bundle.Name}");
            Assert.IsTrue(await Actions.TryCompileTypescript(path), "Typescript compilation failed:\n");
        }
    }

    internal class WebProjectData
    {
        public readonly string ScenePath;
        public readonly string Path;
        
        public WebProjectData(string scenePath, string path)
        {
            ScenePath = scenePath;
            Path = path;
        }

        public override string ToString()
        {
            return System.IO.Path.GetFileNameWithoutExtension(ScenePath);
        }
    }

    [TestFixtureSource(typeof(_01_CompilationChecks), nameof(_01_CompilationChecks.GetWebProjects))]
    internal class _02_WebProjects
    {
        readonly WebProjectData webProject;
        private ExportInfo exportInfo;
        
        public _02_WebProjects(WebProjectData webProject)
        {
            this.webProject = webProject;
        }

        [SetUp]
        public void Setup()
        {
            var scenePath = webProject.ScenePath;
            SampleChecks._.OpenSceneAndCopyIfNeeded(scenePath);
            exportInfo = ExportInfo.Get();
        }

        [Test, Category(SampleChecks.SampleChecks.CodeCategoryName)]
        public async Task InstallCurrentProject()
        {
            if (!exportInfo) 
                Assert.Inconclusive("No ExportInfo found for scene: " + webProject.ScenePath);
            if (exportInfo.DirectoryName.StartsWith("http")) 
                Assert.Inconclusive("Project is from a remote template: " + webProject.ScenePath);
            
            var projectDir = exportInfo.GetProjectDirectory();
            Assert.IsTrue(await Actions.InstallCurrentProject(false, false), $"Failed to install WebProject: {projectDir}");
        }

        [Test, Category(SampleChecks.SampleChecks.CodeCategoryName)]
        public async Task TypeScriptCompiles()
        {
            if (!exportInfo)
                Assert.Inconclusive("No ExportInfo found for scene: " + webProject.ScenePath);
            if (exportInfo.DirectoryName.StartsWith("http"))
                Assert.Inconclusive("Project is from a remote template: " + webProject.ScenePath);

            var projectDir = exportInfo.GetProjectDirectory();
            Assert.IsTrue(await Actions.TryCompileTypescript(projectDir), "Typescript compilation failed:\n");
        }
    }
}