using System.IO;
using Needle.Engine.Utils;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;

internal class TypescriptChecks
{
	[Test]
	public void InvalidImportPath()
	{
		var npmdefObjects = AssetDatabase.FindAssets("t:NpmdefObject");
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
}