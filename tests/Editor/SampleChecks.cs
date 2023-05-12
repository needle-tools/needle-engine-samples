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

namespace SampleChecks
{
    internal class SampleChecks
    {
        internal static List<SampleInfo> GetSamples()
        {
            return AssetDatabase.FindAssets("t:SampleInfo")
                .Select(AssetDatabase.GUIDToAssetPath)
                .Select(AssetDatabase.LoadAssetAtPath<SampleInfo>)
                .ToList();
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
        
        [Test]
        public async Task IsLive()
        {
            var sampleLiveUrl = sample.LiveUrl;
            Assert.IsNotEmpty(sampleLiveUrl, "Live URL is invalid");
            
            // HTTP Header Only Request
            var request = new UnityEngine.Networking.UnityWebRequest(sampleLiveUrl, "HEAD");
            request.timeout = 5;
            var operation = request.SendWebRequest();
            while (!operation.isDone)
                await Task.Yield();
            
            Debug.Log("Response Code from " + sampleLiveUrl + ": " + request.responseCode);
            
            Assert.That(request.responseCode, Is.EqualTo(200), "Sample is not live: " + sample.name);
        }

        [Ignore("Can't reliably detect version of deployed projects yet")] 
        // [Test]
        public async Task VersionIsNotTooOld()
        {
            // fetch the HTML page
            var sampleLiveUrl = sample.LiveUrl;
            var request = UnityWebRequest.Get(sampleLiveUrl);
            request.timeout = 5;    
            var operation = request.SendWebRequest();
            while (!operation.isDone)
                await Task.Yield();
            
            // get the index.***.js file (vite bundle)
            var html = request.downloadHandler.text;
            
            // create a regex for this that extracts the src path
            // <script type="module" crossorigin src="./assets/index.2083fa2e.js"></script>
            var regex = new System.Text.RegularExpressions.Regex("<script type=\"module\" crossorigin src=\"(?<src>.*)\"></script>");
            var match = regex.Match(html);
            var path = match.Groups["src"].Value;
            
            
            // fetch path
            var jsPath = sampleLiveUrl + "/" + path.TrimStart('.');
            
            
            Debug.Log("INDEX JS: " + jsPath);
            
            request = UnityWebRequest.Get(jsPath);
            request.timeout = 5;
            operation = request.SendWebRequest();
            while (!operation.isDone)
                await Task.Yield(); 
            
            // get the version number
            var js = request.downloadHandler.text;
            
            // System.IO.File.WriteAllText("D:/temp.js", js);
            
            // find the string via Regex "\u2014 Version 2.65.0-pre.1" and extract the version
            regex = new System.Text.RegularExpressions.Regex("needle - https://needle.tools (.*) Version (?<version>.*)\"");
            match = regex.Match(js);
            var version = match.Groups["version"].Value;

            // var containsVersion = js.Contains("needle - https://needle.tools");
            
            // regex check with matches for major/minor/patch-pre so that we can use these as matches
            var regex2 = new System.Text.RegularExpressions.Regex(@"(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(-(?<suffix>\w+))?"); 
            match = regex2.Match(version);
            var major = match.Groups["major"].Value;
            var minor = match.Groups["minor"].Value;
            var patch = match.Groups["patch"].Value;    
            var pre = match.Groups["suffix"].Value;
            
            // TODO proper SemVer check
            var isSemver = !string.IsNullOrEmpty(major) && !string.IsNullOrEmpty(minor) && !string.IsNullOrEmpty(patch);

            if (!isSemver)
            {
                Assert.Inconclusive("Version not detected. Used Needle Engine version may not expose a version.");
            }
            else
            {
                Assert.GreaterOrEqual(major, 3, "Version is too old: " + version);      
            }
        }

        [Test]
        public void HasValidInfo()
        {
            Assert.True(sample.Thumbnail, "No thumbnail");
            
            var importer = AssetImporter.GetAtPath(AssetDatabase.GetAssetPath(sample.Thumbnail));
            
            // check if it's non power of two
            Assert.True(importer is TextureImporter textureImporter && textureImporter.npotScale == TextureImporterNPOTScale.None, "Thumbnail is not power of two");
            
            // check for description
            Assert.IsNotEmpty(sample.DisplayNameOrName, "No Display Name");
            Assert.IsNotEmpty(sample.Description, "No description");
            Assert.IsNotEmpty(sample.Tags, "No tags");
            Assert.True(sample.Scene, "No scene assigned");
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

        [Test]
        public void DependencySizeBelow10MB()
        {
            var dependencies = GetDependencies(sample.Scene);
            
            // summarize file size of all of them
            var size = dependencies.Sum(dependency => File.Exists(dependency) ? new FileInfo(dependency).Length : 0);
            
            // check if below 10 MB
            var sizeInMb = size / 1024f / 1024f;
            AssertFileSize(sizeInMb, 10, dependencies.ToList(), "Dependency size is too large");
            Debug.Log($"Dependency size: {sizeInMb:F2} MB");
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
                "Packages/com.needle.engine-internal-assets/Needle FTP Server.asset"
            };
            
            dependencies = dependencies
                .Where(dependency => !allowedPaths.Any(dependency.StartsWith))
                .ToArray();
            
            Assert.IsEmpty(dependencies, $"Some dependencies are outside allowed packages ({dependencies.Length}):\n{string.Join("\n", dependencies)}");
        }

        [Test]
        public void MissingReferencesTest()
        {
            var path = AssetDatabase.GetAssetPath(sample.Scene);
            EditorSceneManager.OpenScene(path, OpenSceneMode.Single);

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
            
            // summarize file size of all of them
            var fileInfos = di.GetFiles("*.*", SearchOption.AllDirectories);
            var size = fileInfos.Sum(file => file.Exists ? file.Length : 0);
            
            // runtime folder asset: 17ecbeb2072245a44ad506ab94d30db5
            var packageFolderPath = Path.GetDirectoryName(Path.GetFullPath(AssetDatabase.GUIDToAssetPath("17ecbeb2072245a44ad506ab94d30db5")));
            
            var files = fileInfos.Select(fi =>
            {
                // convert to package-relative path, we know all files are inside the Samples package here.
                var f = fi.FullName;
                if (f.StartsWith(packageFolderPath))
                    f = f.Substring(packageFolderPath.Length + 1);
                f = f.Replace("\\", "/");
                return "Packages/com.needle.engine-samples/" + f;
            }).ToList();
            
            // check if below 10 MB
            var sizeInMb = size / 1024f / 1024f;
            AssertFileSize(sizeInMb, 10, files, "Folder size is too large");
            Debug.Log($"Folder size: {sizeInMb:F2} MB");
        }

        private void AssertFileSize(float sizeInMb, float allowedSize, List<string> files, string message)
        {
            Assert.LessOrEqual(sizeInMb, allowedSize,
                $"{message}: {sizeInMb:F2} MB. List of files ({files.Count}): \n" + string.Join("\n",
                    files
                        .Select(x => (path: x, fileInfo: new FileInfo(x)))
                        .OrderByDescending(f => f.fileInfo.Length)
                        .Select(fi => $"[{(fi.fileInfo.Length / 1024f / 1024f):F2} MB] {fi.path}")
                ));
        }
    }
}
