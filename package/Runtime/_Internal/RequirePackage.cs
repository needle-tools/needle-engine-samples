using UnityEngine;
#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.PackageManager;
#endif

namespace Needle.Engine
{
    [AddComponentMenu("")]
    internal class RequirePackage : MonoBehaviour
    {
        public string packageName;
    }
    
#if UNITY_EDITOR
    [CustomEditor(typeof(RequirePackage))]
    internal class RequirePackageEditor : Editor
    {
        private bool isInstalled = false;
        private bool isInstalling = false;
        internal static bool IsInstalled(RequirePackage pkg) => File.Exists($"Packages/{pkg.packageName}/package.json");
        
        private void OnEnable()
        {
            isInstalled = IsInstalled(target as RequirePackage);
        }

        public override void OnInspectorGUI()
        {
            var t = target as RequirePackage;
            if (!t) return;
            
            if (isInstalled)
                EditorGUILayout.LabelField("✓ Package \"" + t.packageName + "\" is installed");
            else if (isInstalling)
            {
                EditorGUI.BeginDisabledGroup(true);
                GUILayout.Button("Installing package \"" + t.packageName + "\"...");
                EditorGUI.EndDisabledGroup();
            }
            else
            {
                EditorGUILayout.HelpBox($"The package \"{t.packageName}\" is required for this sample to work.", MessageType.Warning);
                if (GUILayout.Button($"Install {t.packageName}"))
                {
                    Client.Add(t.packageName);
                    isInstalling = true;
                }
            }
        }

        [MenuItem("CONTEXT/RequirePackage/Uninstall Package")]
        static void RemovePackage(MenuCommand cmd)
        {
            Client.Remove((cmd.context as RequirePackage)?.packageName);
        }
    }
#endif
}