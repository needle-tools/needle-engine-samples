using System.Reflection;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;

namespace Needle.Typescript.GeneratedComponents
{
#if UNITY_EDITOR
    [UnityEditor.CustomEditor(typeof(StandardCharacter))]
    public class StandardCharacterEditor : UnityEditor.Editor
    {
        protected System.Type[] mandatoryModules = new System.Type[]
        {
            typeof(PersonCamera),
            typeof(DesktopCharacterInput),
            typeof(MobileCharacterInput),
            typeof(CharacterPhysics)
        };

        protected System.Type[] optionalModules = new System.Type[]
        {
            typeof(CommonAvatar),
            typeof(CommonCharacterAnimations),
            typeof(CommonCharacterAudio)
        };

        const string foldoutPrefsKey = "Character_Modules_Foldout";
        private bool foldout = false;
        private GUIStyle buttonStyle;
        private GUIStyle headerStyle;
        private GUIStyle mainHeaderStyle;

        private void OnEnable()
        {
            foldout = UnityEditor.EditorPrefs.GetBool(foldoutPrefsKey, true);
        }

        public override void OnInspectorGUI()
        {
            if(buttonStyle == null)
            {
                buttonStyle = new GUIStyle(GUI.skin.button);
                buttonStyle.alignment = TextAnchor.MiddleLeft;
            }

            if (headerStyle == null)
            {
                headerStyle = new GUIStyle(GUI.skin.label);
                headerStyle.fontSize += 8;

                mainHeaderStyle = new GUIStyle(UnityEditor.EditorStyles.foldout);
                mainHeaderStyle.fontSize += 8;
                mainHeaderStyle.alignment = TextAnchor.MiddleCenter;
            }

            base.OnInspectorGUI();

            DrawLine();

            using (new GUILayout.HorizontalScope())
            {
                GUILayout.FlexibleSpace();
                foldout = UnityEditor.EditorGUILayout.BeginFoldoutHeaderGroup(foldout, "Modules", mainHeaderStyle);
                GUILayout.FlexibleSpace();

            }
            UnityEditor.EditorPrefs.SetBool(foldoutPrefsKey, foldout);
            if (foldout)
            {
                int indent = 5;
                UnityEditor.EditorGUI.indentLevel += indent;

                if (mandatoryModules.Length > 0)
                {
                    GUILayout.Label("Mandatory modules", headerStyle);
                    GUILayout.Label("Are added on start with default values. Add them yourself to modify the default settings");
                    ListModules(mandatoryModules);

                    GUILayout.Space(20);

                    GUILayout.Label("Optional modules", headerStyle);
                    GUILayout.Label("Add them and configure them in order to make them work");
                    ListModules(optionalModules);
                }

                UnityEditor.EditorGUI.indentLevel -= indent;
            }
            UnityEditor.EditorGUI.EndFoldoutHeaderGroup();
        }

        void ListModules(System.Type[] types)
        {
            foreach (var moduleType in types)
            {
                var obj = (target as Character)?.gameObject;
                var module = obj?.GetComponent(moduleType);
                using (new UnityEditor.EditorGUI.DisabledGroupScope(module != null))
                {
                    using (new GUILayout.HorizontalScope())
                    {
                        if (GUILayout.Button(moduleType.Name, buttonStyle) && obj)
                        {
                            obj.AddComponent(moduleType);
                        }
                        GUILayout.FlexibleSpace();
                    }
                }
            }
        }

        void DrawLine(int height = 1, int spacing = 5, Color? color = null)
        {
            GUILayout.Space(spacing + 4);
            Rect rect = EditorGUILayout.GetControlRect(false, height);
            rect.height = height;
            EditorGUI.DrawRect(rect, color ?? new Color(0.5f, 0.5f, 0.5f, .4f));
            GUILayout.Space(spacing);
        }
    }
#endif
}
