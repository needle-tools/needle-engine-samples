using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEngine;
using UnityEngine.UIElements;

namespace Needle
{
    [ExecuteInEditMode]
    public class AutosetupLayernames : MonoBehaviour
    {
        readonly string supressNoticeKey = "Needle_Sample_Stencil_AutosetupLayernames";

        bool isSupressed => PlayerPrefs.GetInt(supressNoticeKey, 0) == 1;

        readonly int startIndex = 7;
        readonly string[] layersNames = new string[]
        {
            "World_1_Mask",
            "World_1_Content",
            "World_2_Mask",
            "World_2_Content",
            "World_3_Mask",
            "World_3_Content",
        };

        void OnEnable()
        {
            if (IsSetupValid() || !isSupressed)
                return;

            bool proceed = EditorUtility.DisplayDialog("Stencil sample", "For better clarity do you wish to name layers in this project? The sample will work without it, but objects will display empty layer. Also if you use the same layers, this will rename them.", "Yes", "No");

            if (proceed)
                FixSetup();
            else // set supress
                PlayerPrefs.SetInt(supressNoticeKey, 1);
        }

        bool IsSet(string name, int index) => LayerMask.LayerToName(index) == name;

        public bool IsSetupValid()
        {
            bool isValid = true;
            for (int i = 0; i < layersNames.Length; i++)
            {
                int index = startIndex + i;
                if (!IsSet(layersNames[i], index))
                    isValid = false;
            }
            return isValid;
        }

        public void FixSetup()
        {
            Object asset = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset")
                                        .FirstOrDefault();

            if (asset == null)
                return;

            var so = new SerializedObject(asset);
            var layersProp = so.FindProperty("layers");

            //int maxIndex = layersNames.Length - 1 + startIndex;

            //// Add new entries if not present
            //if(layersProp.arraySize <= maxIndex)
            //{
            //    for (int i = layersProp.arraySize; i <= maxIndex; i++)
            //    {
            //        layersProp.InsertArrayElementAtIndex(i);
            //    }
            //}

            for (int i = 0; i < layersNames.Length; i++)
            {
                int index = startIndex + i;
                var element = layersProp.GetArrayElementAtIndex(index);
                element.stringValue = layersNames[i];
            }

            so.ApplyModifiedProperties();
            so.Update();
        }
    }

    [CustomEditor(typeof(AutosetupLayernames))]
    public class AutosetupLayernamesEditor : Editor
    {
        public override void OnInspectorGUI()
        {
            var script = target as AutosetupLayernames;
            if (script == null)
                return;


            if (script.IsSetupValid())
                GUILayout.Label("All is ready");
            else if (GUILayout.Button("Fix layer names"))
                script.FixSetup();
        }
    }
}
