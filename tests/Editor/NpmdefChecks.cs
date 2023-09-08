using System.IO;
using Needle.Engine;
using Needle.Engine.Utils;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;

internal class NpmdefChecks
{
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
				var typescriptFiles = Directory.GetFiles(hiddenPackagePath, "*.ts", SearchOption.AllDirectories);
				foreach (var ts in typescriptFiles)
				{
					var code = File.ReadAllText(ts);
					if (code.Contains("from \"@needle-tools/engine/"))
					{
						Debug.LogError("Invalid import in " + ts.AsLink());
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
									}
									Debug.LogError("Invalid dependency path " + kvp.Key + ": " + kvp.Value + " in " + packageJson.AsLink() + "\n" + possibleFix);
								}
							}
						}
					}
				}
			}
			else Debug.LogWarning("Could not find hidden package path for " + path + " at " + hiddenPackagePath + "");
		}
	}
}