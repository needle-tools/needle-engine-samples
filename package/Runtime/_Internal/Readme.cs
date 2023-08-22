using System.Collections.Generic;
using System.IO;
using System.Linq;
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
        //Dictionary<string, SampleInfo> samplesBySceneGUID;
        //void OnEnable()
        //{
        //    var samples = UnityEditor.AssetDatabase.FindAssets("t:SampleInfo")
        //                                           .Select(UnityEditor.AssetDatabase.GUIDToAssetPath)
        //                                           .Select(path => UnityEditor.AssetDatabase.LoadAssetAtPath<SampleInfo>(path))
        //                                           .Where(x => x && x.Scene)
        //                                           .Select(x => new { path = UnityEditor.AssetDatabase.GetAssetPath(x.Scene), info = x });
        //
        //
        //
        //    samplesBySceneGUID = samples.Where(x => !string.IsNullOrWhiteSpace(x.path))
        //                                .ToDictionary(x => UnityEditor.AssetDatabase.AssetPathToGUID(x.path), x => x.info);
        //
        //    Debug.Log(samples.Count());
        //}

        string data;
        //SampleInfo info;
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
                }
                //samplesBySceneGUID.TryGetValue(readme.Guid, out info);
            }

            var labelSkin = GUI.skin.label;
            var wordWrap = labelSkin.wordWrap;
            var richText = labelSkin.richText;
            labelSkin.wordWrap = true;
            labelSkin.richText = true;

            //if(info != null)
            //{
            //    GUILayout.Box(info.Thumbnail);
            //}
            //
            //if(GUILayout.Button("Open Live"))
            //{
            //    Application.OpenURL(info.LiveUrl);
            //}

            GUILayout.Label(data);

            labelSkin.wordWrap = wordWrap;
            labelSkin.richText = richText;

            serializedObject.ApplyModifiedProperties();
        }

        public string ConvertMarkdownToRichText(string markdown)
        {
            // Convert headers
            markdown = Regex.Replace(markdown, @"^#\s+(.+)$",   "<b><size=14>$1</size></b>", RegexOptions.Multiline);
            markdown = Regex.Replace(markdown, @"^##\s+(.+)$",  "<b><size=13>$1</size></b>", RegexOptions.Multiline);
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
            markdown = Regex.Replace(markdown, @"\`(.+?)\`", "<color=#a1adbf><i>$1</i></color>");

            // Convert lists (assuming unordered lists)
            markdown = Regex.Replace(markdown, @"^\s*-\s+(.+)$", "• $1", RegexOptions.Multiline);

            // Convert links
            markdown = Regex.Replace(markdown, @"\[([^\]]+)\]\(([^\)]+)\)", "<a href=\"$2\">$1</a>");

            return markdown;
        }
    }

#endif
}
