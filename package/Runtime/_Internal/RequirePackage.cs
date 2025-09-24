using UnityEngine;
#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.PackageManager;
#endif

namespace Needle.Engine
{
    [AddComponentMenu("")]
    [NeedleDefaultHeader]
    internal class RequirePackage : MonoBehaviour
    {
        public string packageName;

        /*
        [InitializeOnLoadMethod]
        private static void AddHierarchyIndicator()
        {
            var backgroundColor = EditorGUIUtility.isProSkin ? new Color32(56, 56, 56, 255) : new Color32(194, 194, 194, 255);
            EditorApplication.hierarchyWindowItemOnGUI += (instanceID, rect) =>
            {
                var isSelected = Selection.activeInstanceID == instanceID;
                if (isSelected) return;
                var go = EditorUtility.InstanceIDToObject(instanceID) as GameObject;
                if (go && go.GetComponent<RequirePackage>())
                {
                    var c = GUI.color;
                    GUI.color *= backgroundColor;
                    GUI.DrawTexture(rect, EditorGUIUtility.whiteTexture);
                    var r = new Rect(rect);
                    r.x = r.x - 0;
                    r.width = 16;
                    GUI.color = Color.yellow;
                    GUI.Label(r, "⚠");
                    rect.xMin += 16;
                    GUI.Label(rect, "Package required");
                    GUI.color = c;
                }
            };
        }
        */
    }
    
#if UNITY_EDITOR
    [CustomEditor(typeof(RequirePackage))]
    internal class RequirePackageEditor : Editor
    {
        private bool isInstalled = false;
        private bool isInstalling = false;
        internal static string GetPackageName(RequirePackage pkg)
        {
            if (!pkg) return string.Empty;
#if !UNITY_2022_1_OR_NEWER
            if (pkg.packageName == "com.unity.ai.navigation")
                return "com.unity.modules.ai";
#endif
            return pkg.packageName;
        }
        internal static bool IsInstalled(RequirePackage pkg) => File.Exists($"Packages/{GetPackageName(pkg)}/package.json");
        
        private void OnEnable()
        {
            isInstalled = IsInstalled(target as RequirePackage);
        }

        public override void OnInspectorGUI()
        {
            var t = target as RequirePackage;
            if (!t) return;

            var packageName = GetPackageName(t);
            
            if (isInstalled)
                EditorGUILayout.LabelField("✓ Package \"" + packageName + "\" is installed");
            else if (isInstalling)
            {
                EditorGUI.BeginDisabledGroup(true);
                GUILayout.Button("Installing package \"" + packageName + "\"...");
                EditorGUI.EndDisabledGroup();
            }
            else
            {
                EditorGUILayout.HelpBox($"The package \"{packageName}\" is required for this sample to work.", MessageType.Warning);
                if (GUILayout.Button($"Install {packageName}"))
                {
                    Client.Add(packageName);
                    isInstalling = true;
                }
            }
        }

        [MenuItem("CONTEXT/RequirePackage/Uninstall Package")]
        static void RemovePackage(MenuCommand cmd)
        {
            Client.Remove(GetPackageName(cmd.context as RequirePackage));
        }
    }
#endif
}