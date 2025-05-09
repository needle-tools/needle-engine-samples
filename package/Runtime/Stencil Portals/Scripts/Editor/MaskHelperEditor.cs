﻿using System.Linq;
using UnityEditor;
using UnityEngine;
using UnityEngine.UIElements;

namespace Needle
{
    [CustomEditor(typeof(MaskHelper), true)]
    public class MaskHelperEditor : Editor
    {
        enum MaskState { none, correct, renamed, missing }
        class MaskInfo
        {
            public MaskState State;
            public string CurrentValue;
            public string ExpectedValue => Data.Name;
            public MaskHelper.MaskEntry Data;
        }

        LayerUtility layerUtility = new LayerUtility();

        GUIStyle instructionStyle;

        GUIStyle correctLayerStyle;
        GUIStyle renamedLayerStyle;
        GUIStyle invalidLayerStyle;

        bool isInitalized;
        void Init()
        {
            if (isInitalized)
                return;

            isInitalized = true;

            instructionStyle = new GUIStyle(EditorStyles.helpBox);
            instructionStyle.normal.textColor = EditorStyles.label.normal.textColor;

            correctLayerStyle = new GUIStyle(EditorStyles.label);
            correctLayerStyle.normal.textColor = new Color(0.48f, 0.74f, 0.10f);

            renamedLayerStyle = new GUIStyle(EditorStyles.label);
            renamedLayerStyle.normal.textColor = new Color(0.81f, 0.6f, 0.15f);

            invalidLayerStyle = new GUIStyle(EditorStyles.label);
            // invalidLayerStyle.normal.textColor = new Color(0.85f, 0.7f, 0.5f);
            // invalidLayerStyle.fontStyle = FontStyle.Bold;
        }

        public override void OnInspectorGUI()
        {
            Init();

            var script = target as MaskHelper;
            if (script == null)
                return;

            string message = script.IsLayersHelper ?
                             "This sample requires the tags listed below." :
                             "This sample uses layers. You can set the layer names with the UI below. This step is optional if you're just testing out the sample.";

            GUILayout.Box(message, instructionStyle);
            GUILayout.Space(5);

            using (new GUILayout.HorizontalScope())
            {
                GUILayout.Label("Index", GUILayout.Width(70));

                GUILayout.Label("Name", GUILayout.Width(90));

                GUILayout.FlexibleSpace();
            }

            DrawLine();


            var masks = script.Masks.Select(x => new MaskInfo() { Data = x }).ToArray();
            foreach(var x in masks)
            {
                var currentValue = layerUtility.GetMaskAtIndex(x.Data.Index);
                x.CurrentValue = currentValue;
                if (currentValue == x.Data.Name)
                    x.State = MaskState.correct;
                else if (string.IsNullOrWhiteSpace(currentValue))
                    x.State = MaskState.missing;
                else
                    x.State = MaskState.renamed;
            }

            var overallState = masks.OrderBy(x => (int)x.State).LastOrDefault().State;


            foreach (var x in masks)
                DrawMaskInfo(x);

            DrawLine();

            using (new GUILayout.HorizontalScope())
            {
                string icon = overallState switch
                {
                    MaskState.correct => "TestPassed",
                    MaskState.renamed => "TestPassed",
                    MaskState.missing => "TestFailed",
                    _ => "TestPassed"
                };
                GUILayout.Label(EditorGUIUtility.IconContent(icon));

                string status = overallState switch
                {
                    MaskState.correct => "All is setup correctly.",
                    MaskState.renamed => "All layers are added.",
                    MaskState.missing => "Some layers are not set.",
                    _ => ""
                };
                GUILayout.Label(status);
                GUILayout.FlexibleSpace();
                if (overallState == MaskState.missing && GUILayout.Button("Set all missing layers"))
                    FixAll(masks);
            }
        }

        void FixAll(MaskInfo[] masks)
        {
            foreach (var x in masks)
            {
                if(x.State == MaskState.missing)
                    layerUtility.SetMaskAtIndex(x.Data.Index, x.Data.Name, apply: true);
            }

            //layerUtility.Apply();
        }

        void DrawMaskInfo(MaskInfo mask)
        {
            var currentValue = layerUtility.GetMaskAtIndex(mask.Data.Index);

            GUIStyle style = mask.State switch
            {
                MaskState.correct => correctLayerStyle,
                MaskState.missing => invalidLayerStyle,
                MaskState.renamed => renamedLayerStyle,
                _ => EditorStyles.label
            };

            using (new GUILayout.HorizontalScope())
            {
                GUILayout.Space(10);
                GUILayout.Label($"{mask.Data.Index:00}", style, GUILayout.Width(30));
                GUILayout.Space(10);
                GUILayout.Label($"{(string.IsNullOrEmpty(currentValue) ? "No name set" : currentValue)}", style, GUILayout.MaxWidth(120));
                if (mask.State != MaskState.correct)
                {
                    GUILayout.Label(" ➜ ", style);
                    GUILayout.Label($"{mask.ExpectedValue}", style, GUILayout.MaxWidth(120));

                    var buttonText = mask.State switch
                    {
                        MaskState.missing => "Add",
                        MaskState.renamed => "Rename",
                        _ => ""
                    };

                    if (GUILayout.Button(buttonText))
                        layerUtility.SetMaskAtIndex(mask.Data.Index, mask.ExpectedValue, apply: true);
                }

                GUILayout.FlexibleSpace();
            }
        }

        void DrawLine() => EditorGUILayout.LabelField("", GUI.skin.horizontalSlider);
    }
}
