using System.Reflection;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.UIElements;

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
        private GUIStyle addButton;
        private GUIStyle addedButton;
        private GUIStyle headerStyle;
        private GUIStyle foldoutStyle;
        private GUIStyle wordWrapStyle;

        private void OnEnable()
        {
            foldout = UnityEditor.EditorPrefs.GetBool(foldoutPrefsKey, true);
        }

        public override void OnInspectorGUI()
        {
            if(addedButton == null)
            {
                addButton = new GUIStyle(GUI.skin.button);
                addButton.alignment = TextAnchor.MiddleLeft;

                addedButton = new GUIStyle(GUI.skin.label);
                addedButton.normal.textColor = new Color(0.5f, 0.5f, 0.5f);

                headerStyle = new GUIStyle(GUI.skin.label);
                headerStyle.fontStyle = FontStyle.Bold;
                headerStyle.fontSize += 2;
                headerStyle.wordWrap = true;

                wordWrapStyle = UnityEditor.EditorStyles.wordWrappedLabel;

                foldoutStyle = new GUIStyle(UnityEditor.EditorStyles.foldout);
                foldoutStyle.fontStyle = FontStyle.Bold;
                foldoutStyle.fontSize += 4;
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

        void ListModules(System.Type[] types)
        {
            var obj = (target as Character).gameObject;
            if (obj == null) return;

            foreach (var moduleType in types)
            {
                var module = obj?.GetComponentInChildren(moduleType);
                //UnityEditor.EditorGUI.BeginDisabledGroup(module != null);

                GUILayout.BeginHorizontal();
                using (new GUILayout.HorizontalScope(GUILayout.MaxWidth(60)))
                {
                    if (module != null)
                    {
                        if (GUILayout.Button("Added", addedButton))
                            UnityEditor.EditorGUIUtility.PingObject(obj);
                    }
                    else 
                    {
                        if (GUILayout.Button("Add", addButton))
                            obj.AddComponent(moduleType);
                    }

                    GUILayout.FlexibleSpace();
                }

                GUILayout.Space(10);

                GUILayout.Label(moduleType.Name, GUILayout.Width(150));
                        
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
