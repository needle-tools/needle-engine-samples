using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using NUnit.Framework;
using Needle.Engine.Samples;
using UnityEditor;
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
    }
}
