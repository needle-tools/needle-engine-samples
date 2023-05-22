using System.Collections.Generic;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.Build.Player;

public class CompilationChecks
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
}
