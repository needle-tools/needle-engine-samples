using System.IO;
using System.Text.RegularExpressions;
using UnityEngine;

namespace Needle.Engine
{
    public class Readme : MonoBehaviour
    {
        public string Guid;
    }

#if UNITY_EDITOR

    // TODO: Handle hypertext interaction
    [UnityEditor.CustomEditor(typeof(Readme))]
    public class ReadmeEditor : UnityEditor.Editor
    {
        private string data;
        private static GUIStyle _readmeStyle;

        public override void OnInspectorGUI()
        {
            var readme = target as Readme;
            if (!readme) return;

            var hasGuid = !string.IsNullOrWhiteSpace(readme.Guid);
            var hasData = data != null && data.Length > 0;

            if (!hasGuid)
            {
                var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
                if (scene.IsValid() && !string.IsNullOrWhiteSpace(scene.path))
                {
                    readme.Guid = UnityEditor.AssetDatabase.GUIDFromAssetPath(scene.path).ToString();
                    hasGuid = true;
                }
                else
                {
                    hasGuid = false;
                }
            }

            if(!hasData && hasGuid)
            {
                var path = UnityEditor.AssetDatabase.GUIDToAssetPath(readme.Guid);
                var root = Path.GetDirectoryName(path);
                var readmePath = $"{root}/README.md";
                if (File.Exists(readmePath))
                {
                    string md = File.ReadAllText(readmePath);
                    data = ConvertMarkdownToRichText(md);
                }
                else
                {
                    readme.Guid = null;
                    GUILayout.Label("No README.md was found in the location of this scene.");
                    return;
                }
                //samplesBySceneGUID.TryGetValue(readme.Guid, out info);
            }

            if (_readmeStyle == null)
            {
                _readmeStyle = new GUIStyle(GUI.skin.label);
                _readmeStyle.wordWrap = true;
                _readmeStyle.richText = true;
            }
            
            GUILayout.TextArea(data, _readmeStyle);
            serializedObject.ApplyModifiedProperties();
        }

        public string ConvertMarkdownToRichText(string markdown)
        {
            // Convert headers
            markdown = Regex.Replace(markdown, @"^#\s+(.+)$",   "<b><size=24>$1</size></b>", RegexOptions.Multiline);
            markdown = Regex.Replace(markdown, @"^##\s+(.+)$",  "<b><size=16>$1</size></b>", RegexOptions.Multiline);
            markdown = Regex.Replace(markdown, @"^###\s+(.+)$", "<b><size=12>$1</size></b>", RegexOptions.Multiline);
            
            // Convert bold
            markdown = Regex.Replace(markdown, @"\*\*(.+?)\*\*", "<b>$1</b>");
            markdown = Regex.Replace(markdown, @"__(.+?)__", "<b>$1</b>");
            
            // Convert italic
            markdown = Regex.Replace(markdown, @"\*(.+?)\*", "<i>$1</i>");
            //markdown = Regex.Replace(markdown, @"_(.+?)_", "<i>$1</i>"); // fails?
            
            // Convert block
            markdown = Regex.Replace(markdown, @"```([^`]+)```", "<color=#7894bf><i>\n-----$1-----\n</i></color>");
            
            // Convert inline-block
            markdown = Regex.Replace(markdown, @"\`(.+?)\`", "<color=#aaa><i>$1</i></color>");
            
            // Convert lists (assuming unordered lists)
            markdown = Regex.Replace(markdown, @"^\s*-\s+(.+)$", "• $1", RegexOptions.Multiline);

            // Convert links
            markdown = Regex.Replace(markdown, @"\[([^\]]+)\]\(([^\)]+)\)","$1 <a href=\"$2\">$2</a>");
            
            return markdown;
        }
    }

#endif
}
