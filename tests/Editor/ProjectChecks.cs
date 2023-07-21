using System.Collections;
using System.Collections.Generic;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

internal class ProjectChecks
{
    [Test]
    public void LinearColorSpace()
    {
        Assert.AreEqual(QualitySettings.activeColorSpace, ColorSpace.Linear);
    }
    
    [Test]
    public void LightsUseLinearIntensity()
    {
        Assert.AreEqual(GraphicsSettings.lightsUseLinearIntensity, true);
    }
    
    [Test]
    public void LightsUseColorTemperature()
    {
        Assert.AreEqual(GraphicsSettings.lightsUseColorTemperature, true);
    }

    [MenuItem("Needle Engine/Internal/Set lighting settings to Linear")]
    static void SetLightingSettingsToLinear()
    {
        PlayerSettings.colorSpace = ColorSpace.Linear;
        GraphicsSettings.lightsUseLinearIntensity = true;
        GraphicsSettings.lightsUseColorTemperature = true;
        AssetDatabase.Refresh();
        EditorApplication.ExecuteMenuItem("File/Save Project");
    }
}