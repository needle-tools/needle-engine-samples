using UnityEngine;

namespace Needle
{
    [ExecuteInEditMode]
    public abstract class MaskHelper : MonoBehaviour
    {
        public struct MaskEntry
        {
            public byte Index;
            public string Name;
        }

        public abstract MaskEntry[] Masks { get; }
        public abstract EditorMaskUtility MaskUtility { get; }
        public abstract string HelperID { get; }

        // TODO: change to enum (Layers, Tags, SortingLayer)
        public abstract bool IsLayersHelper { get; }

#if UNITY_EDITOR
        string supressKey => $"Needle_Samples_MaskHighlightSupress_{HelperID}";
        bool isSupressed
        {
            get => UnityEditor.EditorPrefs.GetBool(supressKey, false);
            set => UnityEditor.EditorPrefs.SetBool(supressKey, value);
        }

        void OnEnable()
        {
            if (isSupressed)
                return;

            isSupressed = true;

            UnityEditor.Selection.activeGameObject = gameObject;
            UnityEditor.EditorGUIUtility.PingObject(gameObject);
        }

        [ContextMenu("Debug_resetSupress")]
        void ResetSupress() => isSupressed = false;
#endif
    }
}
