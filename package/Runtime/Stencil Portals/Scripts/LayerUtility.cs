using System;
using System.Linq;
using UnityEngine;

#if UNITY_EDITOR
using UnityEditor;
#endif

using Object = UnityEngine.Object;

namespace Needle
{  
    public class LayerUtility : EditorMaskUtility
    {
        public override string[] Masks
        {
            get
            {
                var array = new string[32];
                for (int i = 0; i < array.Length; i++)
                {
                    array[i] = GetMaskAtIndex(i);
                }
                return array;
            }
        }

        public override string GetMaskAtIndex(int index)
        {
            index = Mathf.Clamp(index, 0, 31);
            return LayerMask.LayerToName(index);
        }

#if UNITY_EDITOR
        SerializedObject _tagManagerObject;
        SerializedObject tagManagerObject
        {
            get
            {
                if (_tagManagerObject == null)
                {
                    Object asset = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset")
                                                .FirstOrDefault();

                    if (asset == null)
                        return null;

                    _tagManagerObject = new SerializedObject(asset);
                }

                return _tagManagerObject;
            }
        }

        SerializedProperty _layerProperty;
        SerializedProperty layerProperty
        {
            get
            {
                if (tagManagerObject != null && _layerProperty == null)
                    _layerProperty = tagManagerObject.FindProperty("layers");

                return _layerProperty;
            }
        }

        public override void SetMaskAtIndex(int index, string value, bool apply = true)
        {
            if (layerProperty == null)
                return;

            index = Mathf.Clamp(index, 0, 31);
            
            var element = layerProperty.GetArrayElementAtIndex(index);
            element.stringValue = value;

            if (apply)
                Apply();
        }

        public void Apply()
        {
            if (tagManagerObject == null)
                return;

            tagManagerObject.ApplyModifiedProperties();
            tagManagerObject.Update();
        }
#else
        public override void SetMaskAtIndex(int index, string value, bool apply = true) { }
#endif

    }
}
