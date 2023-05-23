using Needle.Engine;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using Object = UnityEngine.Object;

public class SampleAdjustmentsWindow : EditorWindow
{
    [MenuItem("Tools/Sample Adjustments")]
    static void Open()
    {
        var win = EditorWindow.GetWindow(typeof(SampleAdjustmentsWindow));
        win.Show();
    }

    void OnGUI()
    {
        if (GUILayout.Button("Execute"))
        {
            var samples = GetSamples();
            Debug.Log($"Get samples {samples.Length}\n{string.Join("\n", samples.Select(x => x.DisplayName))}");

            EditSamples(samples,
                        edit: (sample) =>
                        {
                            Debug.Log($"Editting {sample.DisplayName}");
                            var meta = FindObjectOfType<HtmlMeta>();
                            if (meta)
                                return;

                            var exportInfo = FindObjectOfType<ExportInfo>();
                            meta = exportInfo.gameObject.AddComponent<HtmlMeta>();

                            meta.meta.title = sample.DisplayName;
                            meta.meta.image = sample.Thumbnail;
                            meta.meta.description = sample.Description;
                        },
                        validate: (sample) =>
                        {
                            return !string.IsNullOrWhiteSpace(sample.DisplayName);
                        },
                        saveScene: true);
        }
    }

    void EditSamples(InternalSampleInfo[] samples, Action<InternalSampleInfo> edit, Func<InternalSampleInfo, bool> validate, bool saveScene)
    {
        foreach (var x in samples)
        {
            if (!validate(x) || x.Scene == null)
                continue;

            var scene = EditorSceneManager.OpenScene(AssetDatabase.GetAssetPath(x.Scene));

            edit(x);

            if(saveScene)
                EditorSceneManager.SaveScene(scene);
        }
    }

    InternalSampleInfo[] GetSamples()
    {
        return AssetDatabase.FindAssets($"t:sampleinfo")
                            .Select(AssetDatabase.GUIDToAssetPath)
                            .Select(path => AssetDatabase.LoadAssetAtPath<Object>(path))
                            .Where(x => x)
                            .Select(x =>
                            {
                                var so = new SerializedObject(x);
                                var sceneProp = so.FindProperty("Scene");
                                var liveProp = so.FindProperty("LiveUrl");
                                var imageProp = so.FindProperty("Thumbnail");
                                var nameProp = so.FindProperty("DisplayName");
                                var descriptionProp = so.FindProperty("Description");

                                if (sceneProp != null && liveProp != null && imageProp != null && nameProp != null && descriptionProp != null)
                                {
                                    return new InternalSampleInfo()
                                    {
                                        Scene = sceneProp.objectReferenceValue as SceneAsset,
                                        Thumbnail = imageProp.objectReferenceValue as Texture2D,
                                        LiveURL = liveProp.stringValue,
                                        Description = descriptionProp.stringValue,
                                        DisplayName = nameProp.stringValue
                                    };
                                }
                                else
                                    return null;

                            })
                            .Where(x => x != null)
                            .ToArray();
    }

    class InternalSampleInfo
    {
        public SceneAsset Scene;
        public Texture2D Thumbnail;
        public string LiveURL;
        public string DisplayName;
        public string Description;
    }
}
