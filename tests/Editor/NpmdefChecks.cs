using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Needle.Engine;
using Needle.Engine.Utils;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.PackageManager.UI;
using UnityEngine;

internal class NpmdefChecks
{
	[Test]
	// [Category(RobustnessCategoryName)]
	public async Task AllCompile()
	{
		var npmdefObjects = AssetDatabase.FindAssets("t:NpmdefObject");
		Debug.Assert(npmdefObjects.Length > 0, "No npmdef objects found");
		for (var index = 0; index < npmdefObjects.Length; index++)
		{
			var guid = npmdefObjects[index];
			var path = AssetDatabase.GUIDToAssetPath(guid);
			var fileInfo = new FileInfo(path);
			var asset = AssetDatabase.LoadAssetAtPath<Object>(path);
			var hiddenPackagePath = fileInfo.Directory?.FullName + "/" +
			                        Path.GetFileNameWithoutExtension(fileInfo.Name) + "~";
			if (Directory.Exists(hiddenPackagePath))
			{
				// Debug.Log("Install " + hiddenPackagePath);
				// Assert.IsTrue(await ProcessHelper.RunCommand("npm install", hiddenPackagePath));
				Debug.Log("------------------");
				Debug.Log($"<b>Compiling ({index}/{npmdefObjects.Length})</b> - {hiddenPackagePath}", asset);
				var res = await Actions.TryCompileTypescript(hiddenPackagePath);
				if (!res) Debug.LogError("Failed to compile " + hiddenPackagePath, asset);
			}
			else Debug.LogWarning($"Could not find npmdef package path for {path} at {hiddenPackagePath}", asset);
		}

		Debug.Log("Finished npmdef compile");
	}
	
	[Test]
	public void InvalidImportPath()
	{
		var npmdefObjects = AssetDatabase.FindAssets("t:NpmdefObject");
		Debug.Assert(npmdefObjects.Length > 0, "No npmdef objects found");
		foreach (var guid in npmdefObjects)
		{
			var path = AssetDatabase.GUIDToAssetPath(guid);
			var fileInfo = new FileInfo(path);
			var hiddenPackagePath = fileInfo.Directory?.FullName + "/" + Path.GetFileNameWithoutExtension(fileInfo.Name) + "~";
			if (Directory.Exists(hiddenPackagePath))
			{
				var files = new List<FileInfo>();
				SampleChecks._.GetFiles(hiddenPackagePath, files);
				var typescriptFiles = files.Where(x => x.Extension == ".ts").Select(x => x.FullName).ToList();
				foreach (var ts in typescriptFiles)
				{
					try
					{
						// ignore type files
						if (ts.EndsWith(".d.ts")) continue;
						var code = File.ReadAllText(ts);
						if (code.Contains("from \"@needle-tools/engine/"))
						{
							Debug.LogError("Invalid import in " + ts.AsLink());
						}
					}
					catch (DirectoryNotFoundException)
					{
						// ignore
					}
				}
			}
			else Debug.LogWarning("Could not find hidden package path for " + path + " at " + hiddenPackagePath + "");
		}
	}
	
	
	[Test]
	public void InvalidPackageJsonPaths()
	{
		var npmdefObjects = AssetDatabase.FindAssets("t:NpmdefObject");
		Debug.Assert(npmdefObjects.Length > 0, "No npmdef objects found");
		foreach (var guid in npmdefObjects)
		{
			var path = AssetDatabase.GUIDToAssetPath(guid);
			var fileInfo = new FileInfo(path);
			var hiddenPackagePath = fileInfo.Directory?.FullName + "/" + Path.GetFileNameWithoutExtension(fileInfo.Name) + "~";
			if (Directory.Exists(hiddenPackagePath))
			{
				var packageJson = hiddenPackagePath + "/package.json";
				CheckDependencies("dependencies");
				CheckDependencies("devDependencies");
				CheckDependencies("peerDependencies");
				void CheckDependencies(string key)
				{
					if (PackageUtils.TryReadDependencies(packageJson, out var deps, key))
					{
						var fixups = new Dictionary<string, string>();
						foreach (var kvp in deps)
						{
							if (PackageUtils.TryGetPath(packageJson, kvp.Value, out var fp))
							{
								if (Path.IsPathRooted(fp))
								{
									var possibleFix = "";
									if(NpmUnityEditorVersions.TryGetRecommendedVersion(kvp.Key, out var version))
									{
										possibleFix = "→ You probably want to use " + version + " instead";
										fixups[kvp.Key] = version;
									}
									var message = "Invalid dependency path " + kvp.Key + ": " + kvp.Value + " in " +
									              packageJson.AsLink() + "\n" + possibleFix;
									if (possibleFix.Length > 0) Debug.LogWarning(message);
									else Debug.LogError(message);
								}
							}
						}
						if (fixups.Count > 0)
						{
							Debug.Log("Fixing " + fixups.Count + " dependencies in " + packageJson.AsLink());
							foreach (var fix in fixups)
							{
								var cur = deps[fix.Key];
								Debug.Log("Replace " + fix.Key + " from " + cur + " to " + fix.Value);
								deps[fix.Key] = fix.Value;
							}
							PackageUtils.TryWriteDependencies(packageJson, deps, key);
						}
					}
				}
			}
			else Debug.LogWarning("Could not find hidden package path for " + path + " at " + hiddenPackagePath + "");
		}
	}
}