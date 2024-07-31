using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;
using Needle.Engine.Samples;
using Needle.MissingReferences;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Networking;
using System;
using System.Text.RegularExpressions;
using Needle.Engine;
using Needle.Engine.Deployment;
using Needle.Engine.Projects;
using Needle.Engine.Samples.Helpers;
using Object = UnityEngine.Object;
using Actions = Needle.Engine.Actions;
using Needle.Engine.Components;
using Needle.Typescript.GeneratedComponents;
using Needle.Engine.Utils;
using Newtonsoft.Json.Linq;

namespace SampleChecks
{
    internal class SampleChecks
    {
        internal const string ProductionStateCategoryName = "Deployments";
        internal const string PublicInfoCategoryName = "Docs";
        internal const string CodeCategoryName = "Code";

        internal static List<SampleInfo> GetSamples()
        {
            return AssetDatabase.FindAssets("t:SampleInfo")
                .Select(AssetDatabase.GUIDToAssetPath)
                .Select(AssetDatabase.LoadAssetAtPath<SampleInfo>)
                .ToList();
        }
        
        internal static readonly string[] ignoreSizeFolderNames =
        {
            "node_modules",
        };


        [Test]
        public async Task NoGzipDeployments()
        {
            const string validateUrl = "https://engine.needle.tools/samples-uploads/__validate"; 
            var request = UnityWebRequest.Get(validateUrl);
            request.timeout = 5;
            
            var operation = request.SendWebRequest();
            while (!operation.isDone)
                await Task.Yield();
            
            Assert.True(request.result == UnityWebRequest.Result.Success, "Can't reach validation endpoint");
            
            var result = request.downloadHandler.text;
            var warningCount = Regex.Matches(result, Regex.Escape("WARNING")).Count;
            
            // find all matches for URLs in this: <span class="folderlink"><a href='digital-landscape/'>
            var matches = Regex.Matches(result, "<span class=\"folderlink\"><a href='(?<url>.*?)/'>");
            var groupValues = new List<string>();
            foreach (Match match in matches)
                groupValues.Add(match.Groups["url"].Value);
            var matchList = string.Join("\n", groupValues);
            Assert.AreEqual(0, warningCount, $"Site incorrectly deployed without GZIP. index.html found for {warningCount} samples. Please visit {validateUrl} to check.\n\n{matchList}\n");
        }
    }

    [TestFixtureSource(typeof(SampleChecks), nameof(SampleChecks.GetSamples))]
    internal class @_
    {
        private readonly SampleInfo sample;
        
        public @_(SampleInfo sampleInfo)
        {
            sample = sampleInfo;
        }

        const string AutoGenerateBeforeTestsKey = nameof(TempProject) + "_" + nameof(TempProject.AllowAutoGenerate) + "_BeforeTests";
        
        [SetUp]
        public void Setup()
        {
            SessionState.SetBool(AutoGenerateBeforeTestsKey, TempProject.AllowAutoGenerate);
            TempProject.AllowAutoGenerate = false;
        }
        
        [TearDown]
        public void TearDown()
        {
            TempProject.AllowAutoGenerate = SessionState.GetBool(AutoGenerateBeforeTestsKey, true);
            SessionState.EraseBool(AutoGenerateBeforeTestsKey);
        }
        
        [Test]
        [Category(SampleChecks.ProductionStateCategoryName)]
        public async Task IsLive()
        {
            var sampleLiveUrl = sample.LiveUrl;
            Assert.IsNotEmpty(sampleLiveUrl, "Live URL is invalid");
            
            // HTTP Header Only Request
            var request = new UnityWebRequest(sampleLiveUrl, "HEAD");
            request.timeout = 5;

            var operation = request.SendWebRequest();
            while (!operation.isDone)
                await Task.Yield();

            Assert.That(request.responseCode, Is.EqualTo(200), "Sample is not live: " + sample.name + " at " + sampleLiveUrl);
        }

        /// <summary>
        /// Needle Engine package versions from oldest to newest
        /// </summary>
        static List<(int major, int minor, int patch, string suffix, string version)> enginePackageVersions;

        async Task GetEngineVersionsIfNeeded()
        {
            if (enginePackageVersions != null)
                return;

            enginePackageVersions = new();

            var enginePackageInfo = await NpmUtils.TryGetCompletePackageInfo("@needle-tools/engine");
            if (!enginePackageInfo.TryGetValue("versions", out var versionsObject))
                Assert.Inconclusive("Can't parse needle engine package info");

            var versionRoot = enginePackageInfo["versions"] as JObject;
            foreach (var x in versionRoot)
            {
                if (GetSemVersion(x.Key, out int _major, out int _minor, out int _patch, out string _suffix))
                {
                    enginePackageVersions.Add((_major, _minor, _patch, _suffix, x.Key));
                }
            }

            enginePackageVersions.OrderBy(x => x.major)
                                 .ThenBy(x => x.minor)
                                 .ThenBy(x => x.patch)
                                 .ThenBy(x => x.suffix)
                                 .ToList();
        }


        [Test]
        [Category(SampleChecks.ProductionStateCategoryName)]
        public async Task VersionIsNotTooOld()
        {
            // fetch the HTML page
            var sampleLiveUrl = sample.LiveUrl;
            Assert.IsNotEmpty(sampleLiveUrl, "Live URL is invalid");
            
            var request = UnityWebRequest.Get(sampleLiveUrl);
            request.timeout = 5;
            
            var operation = request.SendWebRequest();
            while (!operation.isDone)
                await Task.Yield();
            
            // this is the HTML file; if it was generated by Needle, it should contain a meta tag with generator and version
            var html = request.downloadHandler.text;

            // create a regex for this that extracts the content
            // <meta name="needle-engine" content="3.5.8-alpha">
            var regex = new Regex("<meta name=\"needle-engine\" content=\"(?<version>.*)\">");
            var match = regex.Match(html);
            var version = match.Groups["version"].Value;

            // regex check with matches for major/minor/patch-pre so that we can use these as matches
            if (!GetSemVersion(version, out var major, out var minor, out var patch, out var suffix))
                Assert.Inconclusive("Version not detected in the HTML meta tags of the live sample. That usually means the used Needle Engine version is too old.");

            Debug.Log($"Deployment version: {major}.{minor}.{patch}");


            await GetEngineVersionsIfNeeded();

            var stableReleases = enginePackageVersions.Where(x => string.IsNullOrEmpty(x.suffix));
            var lastStable = stableReleases.LastOrDefault();

            Assert.IsNotNull(lastStable, "Can't determine last stable package version");

            Debug.Log($"Latest stable version: {lastStable.version}");

            // semantically check if deployment isn't behind a stable release
            var errorMsg = $"Version is too old ({version}). Latest stable version is newer then the deployment {lastStable.version}";
            Assert.GreaterOrEqual(major, lastStable.major, errorMsg);

            if (major == lastStable.major)
            {
                Assert.GreaterOrEqual(minor, lastStable.minor, errorMsg);
                if(minor == lastStable.minor)
                {
                    Assert.GreaterOrEqual(patch, lastStable.patch, errorMsg);
                    // TODO:check for suffix
                }
            }
        }

        bool GetSemVersion(string input, out int major, out int minor, out int patch, out string suffix)
        {
            var regex = new Regex(@"(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(-(?<suffix>\w+))?");
            var match = regex.Match(input);
            var majorText = match.Groups["major"]?.Value ?? "";
            var minorText = match.Groups["minor"]?.Value ?? "";
            var patchText = match.Groups["patch"]?.Value ?? "";

            major = -1;
            minor = -1;
            patch = -1;
            suffix = match.Groups["suffix"].Value;

            return int.TryParse(majorText, out major) && int.TryParse(minorText, out minor) && int.TryParse(patchText, out patch);
        } 

        [Test]
        [Category(SampleChecks.PublicInfoCategoryName)]
        public void HasValidInfo()
        {
            Assert.True(sample.Thumbnail, "No thumbnail");
            
            var importer = AssetImporter.GetAtPath(AssetDatabase.GetAssetPath(sample.Thumbnail));

            // check if it's non power of two
            bool validImport = importer is TextureImporter textureImporter && textureImporter.npotScale == TextureImporterNPOTScale.None;

            int w = sample.Thumbnail.width;
            int h = sample.Thumbnail.height;
            bool textureIsPOT = (w != 0 && (w & (w - 1)) == 0) &&
                                (h != 0 && (h & (h - 1)) == 0);
            
            Assert.True(validImport || textureIsPOT, "Thumbnail is power of two. (results in bad aspect ratio)");
            
            // check for description
            Assert.IsNotEmpty(sample.DisplayNameOrName, "No Display Name");
            Assert.IsNotEmpty(sample.Description, "No description");
            Assert.IsNotEmpty(sample.Tags, "No tags");
            Assert.True(sample.Scene, "No scene assigned");
        }

        [Test]
        [Category(SampleChecks.PublicInfoCategoryName)]
        public void HasReadme()
        {
            // simple check if the file exists
            var sampleDirectory = AssetDatabase.GetAssetPath(sample.Scene);
            sampleDirectory = Path.GetDirectoryName(sampleDirectory);
            if (sampleDirectory == null) return;
            var readmePath = Path.Combine(sampleDirectory, "README.md");
            Assert.IsTrue(File.Exists(readmePath), "No README.md found");
            
            // we need to ensure it's actually called README.md and not readme.md or Readme.md or something else
            var filesystemEntries = Directory.GetFileSystemEntries(sampleDirectory, "README.md");
            var first = filesystemEntries.FirstOrDefault();
            Assert.IsTrue(first != null && first.EndsWith("README.md", StringComparison.Ordinal), "File should be called README.md (uppercase)");
        }

        [Test]
        [Category(SampleChecks.PublicInfoCategoryName)]
        public void HasReadmeComponent()
        {
            OpenSceneAndCopyIfNeeded();
            
            var readme = Object.FindAnyObjectByType<Readme>();
            Assert.IsNotNull(readme);
            Assert.IsFalse(string.IsNullOrEmpty(readme.Guid));
            Assert.IsTrue(readme.CompareTag("EditorOnly"), "Readme component should be tagged as EditorOnly.");
            Assert.AreEqual(1, readme.gameObject.GetComponents<Component>().Length - 1, "Readme GameObject has too many components, should only have Readme");
        }

        static string[] ignoreMissingNeedleMenu =
        {
            "Car Physics",
        };

        [Test]
        public void HasNeedleMenuAndShowsLogo()
        {
            OpenSceneAndCopyIfNeeded();            
            var menu = Object.FindAnyObjectByType<NeedleMenu>();

            var canSkip = ignoreMissingNeedleMenu.Contains(sample.DisplayName);
            Assert.IsTrue(menu != null || canSkip, "NeedleMenu is missing in the scene");
            Assert.IsTrue(menu.ShowNeedleLogo || canSkip, $"NeedleMenu should have {nameof(NeedleMenu.ShowNeedleLogo)} enabled.");
        }

        [Test]
        public void HasHTMLMetaComponent()
        {
            OpenSceneAndCopyIfNeeded();

            var components = Object.FindObjectsByType<HtmlMeta>(FindObjectsSortMode.None);
            Assert.IsTrue(components.Length > 0, "Scene is missing HTML Meta component");
            Assert.IsTrue(components.Length == 1, "Scene has multiple HTML Meta components");

            var meta = components.FirstOrDefault()?.meta;

            Assert.IsNotNull(meta, "Meta or component is null, unexpected.");

            // get default value of meta.meta.title
            var defaultValues = new HtmlMeta.Meta();

            Assert.IsNotNull(meta.image, "No image");
            Assert.False(meta.title.Equals(defaultValues.title), "Default title");
            Assert.False(string.IsNullOrEmpty(meta.title), "No title");
            Assert.False(meta.description.Equals(defaultValues.description), "Default description");
            Assert.False(string.IsNullOrEmpty(meta.description), "No description");
        }

        static string[] GetDependencies(Object obj)
        {
            // get path of scene
            var path = AssetDatabase.GetAssetPath(obj);
            
            // get all dependencies of scene
            var dependencies = AssetDatabase.GetDependencies(path, true);
            
            // we can ignore all dependencies that are from com.unity packages (and org.khronos packages?)
            dependencies = dependencies
                .Where(dependency => 
                    !dependency.StartsWith("Packages/com.unity") && 
                    !dependency.StartsWith("Packages/org.khronos"))
                .ToArray();
            
            return dependencies;
        }

        static string[] nonSizeRestrictedExtensions =
        {
            ".mp4",
            ".webm",
            ".mp3",
            ".wav"
        };

        [Test]
        public void DependencySizeBelow10MB()
        {
            var dependencies = GetDependencies(sample.Scene);
            var nonSizeRestricted = dependencies.Where(x => nonSizeRestrictedExtensions.Any(y => x.EndsWith(y)));
            var sizeRestricted = dependencies.Where(x => !nonSizeRestricted.Contains(x));

            // summarize file size of all of them
            var restrictedSize = sizeRestricted.Sum(dependency => File.Exists(dependency) ? new FileInfo(dependency).Length : 0);
            var nonRestrictedSize = nonSizeRestricted.Sum(dependency => File.Exists(dependency) ? new FileInfo(dependency).Length : 0);

            // check if below 10 MB
            var restrictedSizeMB = restrictedSize / 1024f / 1024f;
            var nonRestrictedSizeMB = nonRestrictedSize / 1024f / 1024f;

            AssertFileSize(restrictedSizeMB, 10, sizeRestricted.ToList(), "Dependency size is too large", true);
            AssertFileSize(restrictedSizeMB + nonRestrictedSizeMB, 10, nonSizeRestricted.ToList(), "Dependency size is critical", false);

            Debug.Log($"Dependency size: {restrictedSizeMB + nonRestrictedSizeMB:F2} MB");
        }

        [Test]
        public void DependenciesInsideKnownPackages()
        {
            var dependencies = GetDependencies(sample.Scene);
            
            var allowedPaths = new[] {
                "Packages/com.needle.engine-samples",
                "Packages/com.needle.engine-exporter",
                "Packages/com.unity.render-pipelines.universal",
                "Packages/com.unity.render-pipelines.core",
                "Packages/org.khronos.unitygltf",
                "Packages/com.needle.dev-assets/Needle Samples FTP.asset"
            };
            
            dependencies = dependencies
                .Where(dependency => !allowedPaths.Any(dependency.StartsWith))
                .ToArray();
            
            Assert.IsEmpty(dependencies, $"Some dependencies are outside allowed packages ({dependencies.Length}):\n{string.Join("\n", dependencies)}");
        }

        private void OpenSceneAndCopyIfNeeded()
        {
            var path = AssetDatabase.GetAssetPath(sample.Scene);
            OpenSceneAndCopyIfNeeded(path);
        }
        
        internal static void OpenSceneAndCopyIfNeeded(string path)
        {
            Assert.IsTrue(File.Exists(path), "Scene file doesn't exist");

            // immutable scenes can't be opened (e.g. from installed sample package)
            // so we're making a mutable copy here to run tests on it.
            // to simplify things, we're always making a copy right now.
            var makeSceneCopy = true;
            var scenePath = path;
            
            // ReSharper disable once ConditionIsAlwaysTrueOrFalse
            if (makeSceneCopy)
            {
                // create new unique path in Assets to copy the scene to
                var sceneName = Path.GetFileName(path);
                scenePath = $"Assets/{Guid.NewGuid()}_{sceneName}";

                AssetDatabase.CopyAsset(path, scenePath);
            }
            
            // open the temp scene
            EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
            SampleUpdater.PatchActiveScene();

            // remove the mutable copy of the immutable scene
            // ReSharper disable once ConditionIsAlwaysTrueOrFalse
            if (makeSceneCopy)
            {
                if (!AssetDatabase.DeleteAsset(scenePath))
                {
                    AssetDatabase.Refresh();
                    if (!AssetDatabase.DeleteAsset(scenePath))
                    {
                        Debug.LogWarning($"can't delete scene: {scenePath}");
                    }
                }
            }
        }

        [Test]
        public void MissingReferencesTest()
        {
            OpenSceneAndCopyIfNeeded();
            
            // perform scans on the opened scene
            var options = new SceneScanner.Options
            {
                IncludeEmptyEvents = true,
                IncludeMissingMethods = true,
                IncludeUnsetMethods = true
            };
            var scanner = new SceneScanner(options);
            if (scanner.FindMissingReferences())
            {
                // log them nicely
                var missingReferences = scanner.SceneRoots;
                var sb = new StringBuilder();

                foreach (var container in missingReferences)
                    container.Value.FormatAsLog(sb);
                
                Assert.Fail("Missing References:\n" + sb);
            }
        }

        [Test]
        public void DeploymentSetupCorrect()
        {
            OpenSceneAndCopyIfNeeded();

            // explicitly get the DeployToFTP component so we can check the path
            var deployToFtps = Object.FindObjectsByType<DeployToFTP>(FindObjectsSortMode.None);
            Assert.LessOrEqual(deployToFtps.Length, 1, "More than one DeployToFTP component found");

            // We want to avoid accidentally keeping staging paths in the scene
            var first = deployToFtps.FirstOrDefault();
            if (first)
            {
                var usesStagingFolder = first.Path.IndexOf("staging", StringComparison.OrdinalIgnoreCase) >= 0;
                Assert.IsFalse(usesStagingFolder, nameof(DeployToFTP) + " component has staging path in it");
            }
            
            // find all types that are DeploymentComponents
            var deploymentTypes = TypeCache.GetTypesWithAttribute<DeploymentComponentAttribute>();
            var allDeploymentComponentsInScene = new List<MonoBehaviour>();
            foreach (var deploymentType in deploymentTypes)
            {
                var components = Object.FindObjectsByType(deploymentType, FindObjectsInactive.Include, FindObjectsSortMode.None) as MonoBehaviour[];
                if (components == null) continue;
                allDeploymentComponentsInScene.AddRange(components);
            }
            
            Assert.LessOrEqual(allDeploymentComponentsInScene.Count, 1, "Too many deployment components found: " + string.Join(", ", allDeploymentComponentsInScene.Select(x => x.GetType().Name)));
        }

        internal static void GetFiles(string path, List<FileInfo> results)
        {
            var di = new DirectoryInfo(path);
            if (!di.Exists)
                return;
            
            results.AddRange(di.GetFiles());
            
            try {
                foreach (var directory in di.GetDirectories())
                {
                    if (SampleChecks.ignoreSizeFolderNames.Any(ignoredFolder => directory.FullName.Contains(ignoredFolder)))
                        continue;
                    
                    GetFiles(directory.FullName, results);
                }
            } catch {
                // ignore
            }
        }
        
        [Test]
        public void FolderSizeBelow10MB()
        {
            var path = AssetDatabase.GetAssetPath(sample.Scene);
            
            // walk up until the parent is the "runtime" folder
            var di = new DirectoryInfo(path);
            while (true)
            {
                if (di.Parent == null)
                    break;
                if (di.Parent.Name == "Runtime")
                    break;
                di = di.Parent;
            }
            
            // get files and filter them based on a blacklist
            var fileInfos = new List<FileInfo>();
            GetFiles(di.FullName, fileInfos);
            fileInfos = fileInfos
                .Where(x => !SampleChecks.ignoreSizeFolderNames.Any(ignoredFolder => x.FullName.Contains(ignoredFolder)))
                .ToList();

            // runtime folder asset: 17ecbeb2072245a44ad506ab94d30db5
            var packageFolderPath = Path.GetDirectoryName(Path.GetFullPath(AssetDatabase.GUIDToAssetPath("17ecbeb2072245a44ad506ab94d30db5")));
            var files = fileInfos.Where(x => x.Exists).Select(fi =>
            {
                // convert to package-relative path, we know all files are inside the Samples package here.
                var f = fi.FullName;
                if (f.StartsWith(packageFolderPath))
                    f = f.Substring(packageFolderPath.Length + 1);
                f = f.Replace("\\", "/");
                return "Packages/com.needle.engine-samples/" + f;
            }).ToList();

            var nonSizeRestricted = files.Where(x => nonSizeRestrictedExtensions.Any(y => x.EndsWith(y)));
            var sizeRestricted = files.Where(x => !nonSizeRestricted.Contains(x));

            // summarize file size of all of them
            var restrictedSize = sizeRestricted.Sum(file => file.Length);
            var nonRestrictedSize = nonSizeRestricted.Sum(file => file.Length);

            // check if below 10 MB
            var restrictedSizeMB = restrictedSize / 1024f / 1024f;
            var nonRestrictedSizeMB = nonRestrictedSize / 1024f / 1024f;
            
            // check if below 10 MB
            AssertFileSize(restrictedSizeMB, 10, files, "Folder size is too large", true);
            AssertFileSize(restrictedSizeMB + nonRestrictedSizeMB, 10, files, "Folder size is critical", false);
            Debug.Log($"Folder size: {restrictedSizeMB + nonRestrictedSizeMB:F2} MB");
        }

        private void AssertFileSize(float sizeInMb, float allowedSize, List<string> files, string message, bool assert)
        {
            var t = $"{message}: {sizeInMb:F2} MB. List of files ({files.Count}): \n" + string.Join("\n",
                files
                    .Select(x => (path: x, fileInfo: new FileInfo(x)))
                    .OrderByDescending(f => f.fileInfo.Length)
                    .Select(fi => $"[{(fi.fileInfo.Length / 1024f / 1024f):F2} MB] {fi.path}")
            );

            if (assert) 
            {
                Assert.LessOrEqual(sizeInMb, allowedSize, t);
            }
            else if (sizeInMb > allowedSize)
            {
                Assert.Inconclusive(t);
            }
        }

        [Test]
        public void ValidNPMDefReferences()
        {
            OpenSceneAndCopyIfNeeded();

            var info = Object.FindAnyObjectByType<ExportInfo>();
            Assert.IsNotNull(info);

            info.Dependencies.ForEach(x =>
            {
                var path = AssetDatabase.GUIDToAssetPath(x.Guid);
                Assert.IsNotEmpty(path, $"Npmdef called \"{x.Name}\" is referenced with missing guid");
            });
        }

        string[] tempProjectsNames = new string[]
        {
            "Library/Needle/Sample"
        };

        [Test]
        public void ProjectLocation()
        {
            OpenSceneAndCopyIfNeeded();

            var info = Object.FindAnyObjectByType<ExportInfo>();
            Assert.IsNotNull(info, "No ExportInfo found! Invalid scene.");
            if (!string.IsNullOrEmpty(info.RemoteUrl))
                Assert.Pass("Is remote");

            var path = info.DirectoryName;

            if (path.Contains(@"WebProjects~"))
                Assert.Pass();
            else if (tempProjectsNames.Contains(path))
                Assert.Pass();
            else
                Assert.Fail(@$"Project {path} is not a valid temp project or is not located in the correct directory (package\WebProjects~)");
        }

        [Test]
        [Category(SampleChecks.CodeCategoryName)]
        public async Task TypescriptCompiles()
        {
            OpenSceneAndCopyIfNeeded();

            var info = Object.FindAnyObjectByType<ExportInfo>();
            Assert.IsNotNull(info, "No ExportInfo found! Invalid scene.");

            var path = info.GetProjectDirectory();

            // Remote
            if (!Directory.Exists(info.DirectoryName) && !string.IsNullOrWhiteSpace(info.RemoteUrl))
            {
                Debug.Log($"Cloning: {info.RemoteUrl}");

                Assert.IsTrue(await GitActions.CloneProject(info), "Failed cloning a remote template");
                path = info.DirectoryName;
            }
            else // Local
            {
                Actions.EnsureDependenciesAreAddedToPackageJson(info);
            }

            Debug.Log($"Installing {path}");

            Assert.IsTrue(await Actions.RunNpmInstallAtPath(path, false), "Failed while installing.");

            Debug.Log($"Compiling {path}");

            Assert.IsTrue(await Actions.TryCompileTypescript(path));
        }
    }
}
