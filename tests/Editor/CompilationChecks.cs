using System.Collections.Generic;
using Needle.Engine.ProjectBundle;
using System.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.Build.Player;
using System.Threading.Tasks;
using System.Diagnostics;
using NUnit.Framework.Internal;
using UnityEngine;
using System.IO;
using Needle.Engine.Samples;

using Actions = Needle.Engine.Actions;

namespace Compilation
{
    internal class CompilationChecks
    {
        [Test]
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

        // --- TypecSript -----

        static internal List<BundleData> GetModules()
        {
            return AssetDatabase.FindAssets("t:npmdefobject")
                .Select(guid => AssetDatabase.GUIDToAssetPath(guid))
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

        static internal List<WebProjectData> GetProjects()
        {
            // TODO: make test relative, not project relative
            var path = Path.Combine(Application.dataPath, "../../../modules/needle-engine-samples/package/WebProjects~");
            path = Path.GetFullPath(path);
            
            if (!Directory.Exists(path))
                return new List<WebProjectData>();

            var a = Directory.GetDirectories(path)
                .Select(x => new WebProjectData(x))
                .ToList();

            return a;
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

    [TestFixtureSource(typeof(CompilationChecks), nameof(CompilationChecks.GetModules))]
    internal class NpmDefs
    {
        readonly BundleData bundleData;
        Bundle bundle => bundleData.Bundle;
        public NpmDefs(BundleData data)
        {
            bundleData = data;            
        }

        public override string ToString()
        {
            return bundleData.Bundle.Name;
        }

        [Test]
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
        public readonly string Path;
        public WebProjectData(string path)
        {
            Path = path;
        }

        public override string ToString()
        {
            return System.IO.Path.GetFileNameWithoutExtension(Path);
        }
    }

    [TestFixtureSource(typeof(CompilationChecks), nameof(CompilationChecks.GetProjects))]
    internal class WebProjects
    {
        readonly WebProjectData webProject;
        string path => webProject.Path;
        public WebProjects(WebProjectData webProject)
        {
            this.webProject = webProject;
        }

        [Test]
        public async Task Compiles()
        {
            Assert.IsTrue(await Actions.RunNpmInstallAtPath(path, false), $"Failed to install WebProject: {path}");
            Assert.IsTrue(await Actions.TryCompileTypescript(path), "Typescript compilation failed:\n");
        }
    }
}