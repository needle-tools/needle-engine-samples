using System;
using UnityEngine;

namespace Needle.Typescript.GeneratedComponents
{
#if UNITY_EDITOR
    [UnityEditor.CustomEditor(typeof(StandardCharacter))]
    public class StandardCharacterEditor : UnityEditor.Editor
    {
        protected (Type type, string description)[] mandatoryModules = new (Type, string)[]
        {
            (typeof(PersonCamera), "First and third person camera."),
            (typeof(DesktopCharacterInput), "Keyboard input for movement, sprinting and jumping."),
            (typeof(MobileCharacterInput), "Touch screen input for movement, sprinting and jumping."),
            (typeof(CharacterPhysics), "Physics of an character that can walk, jump and stick to platforms.")
        };

        protected (Type type, string description)[] optionalModules = new (Type, string)[]
        {
            (typeof(CommonAvatar), "Base for an Avatar that needs to react to first or third person adjustments."),
            (typeof(CommonCharacterAnimations), "Plays movement animations."),
            (typeof(CommonCharacterAudio), "Plays footstep, landing and jumping sounds.")
        };

        const string foldoutPrefsKey = "Character_Modules_Foldout";
        private bool foldout = false;
        //private GUIStyle addButton;
        private GUIStyle addedButton;
        private GUIStyle headerStyle;
        private GUIStyle foldoutStyle;
        private GUIStyle wordWrapStyle;

        private void OnEnable()
        {
            foldout = UnityEditor.EditorPrefs.GetBool(foldoutPrefsKey, false);
        }

        private GUIContent addedContent = new GUIContent("Added", "The module is already added on this object or its children!");

        public override void OnInspectorGUI()
        {
            if(addedButton == null)
            {
                addedButton = new GUIStyle(GUI.skin.label);
                addedButton.normal.textColor = new Color(0.5f, 0.5f, 0.5f);

                headerStyle = new GUIStyle(UnityEditor.EditorStyles.boldLabel);
                headerStyle.wordWrap = true;

                wordWrapStyle = UnityEditor.EditorStyles.wordWrappedLabel;

                foldoutStyle = new GUIStyle(UnityEditor.EditorStyles.foldout);
                foldoutStyle.fontStyle = FontStyle.Bold;
            }

            base.OnInspectorGUI();

            GUILayout.Space(10);

            foldout = UnityEditor.EditorGUILayout.BeginFoldoutHeaderGroup(foldout, "Modules", style: foldoutStyle);

            UnityEditor.EditorPrefs.SetBool(foldoutPrefsKey, foldout);
            if (foldout)
            {
                DrawLine(height: 1);
                if (mandatoryModules.Length > 0)
                {
                    GUILayout.Label("Default modules", headerStyle);
                    GUILayout.Label("Default modules are added on start with default values. Add them to override the default settings.", wordWrapStyle);
                    ListModules(mandatoryModules);

                    GUILayout.Space(20);
                }

                GUILayout.Label("Optional modules", headerStyle);
                GUILayout.Label("Optional modules implement single features and are not essential for the character to work.", wordWrapStyle);
                ListModules(optionalModules);
            }
            UnityEditor.EditorGUI.EndFoldoutHeaderGroup();
        }

        void ListModules((Type type, string description)[] types)
        {
            var obj = (target as Character).gameObject;
            if (obj == null) return;

            foreach (var typeInfo in types)
            {
                var module = obj?.GetComponentInChildren(typeInfo.type);

                GUILayout.BeginHorizontal();
                using (new GUILayout.HorizontalScope(GUILayout.MaxWidth(50)))
                {
                    if (module != null)
                    {
                        if (GUILayout.Button(addedContent, addedButton))
                            UnityEditor.EditorGUIUtility.PingObject(obj);
                    }
                    else 
                    {
                        if (GUILayout.Button("Add"))
                            obj.AddComponent(typeInfo.type);
                    }

                    GUILayout.FlexibleSpace();
                }

                GUILayout.Space(5);

                GUILayout.Label(typeInfo.type.Name, GUILayout.Width(200));
                GUILayout.Space(10);
                GUILayout.Label(typeInfo.description, wordWrapStyle);

                GUILayout.FlexibleSpace();

                GUILayout.EndHorizontal();
            }
        }

        void DrawLine(int height = 1, int spacing = 5, Color? color = null)
        {
            GUILayout.Space(spacing);
            Rect rect = UnityEditor.EditorGUILayout.GetControlRect(false, height);
            rect.height = height;
            UnityEditor.EditorGUI.DrawRect(rect, color ?? new Color(0.5f, 0.5f, 0.5f, .4f));
            GUILayout.Space(spacing);
        }
    }
#endif
}
