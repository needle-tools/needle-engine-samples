using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;
using Needle.Typescript.GeneratedComponents;

#nullable enable

[CustomEditor(typeof(ConfigurationElement))]
public class ConfigurationElementEditor : Editor
{
    public override void OnInspectorGUI()
    {
        var cfg = target as ConfigurationElement;
        if (cfg == null)
            return;

        Configurator? parentCfg = cfg.transform.parent?.GetComponent<ObjectConfigurator>();
        if(parentCfg != null)
        {
            GUILayout.Label($"Element is being registered automatically by the parent. ({parentCfg.gameObject.name})");
        }
        else
        {
            GUILayout.Label("No configurator is driving this object automatically. You can assign them manually or add ObjectConfigurator to the parent of this object.");
        }
    }
}