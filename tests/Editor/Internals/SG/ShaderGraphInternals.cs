#if UNITY_2021_1_OR_NEWER
#define HAVE_BIRP_SG
#endif

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Newtonsoft.Json;
using UnityEditor;
using UnityEditor.Graphing.Util;
#if HAVE_BIRP_SG
using UnityEditor.Rendering.BuiltIn.ShaderGraph;
#endif
using UnityEditor.ShaderGraph;
using UnityEditor.ShaderGraph.Serialization;
using UnityEngine;


namespace Needle
{
    public class ShaderGraphInternals
    {
        public struct TargetsInfo
        {
            public enum TargetType
            {
                Lit,
                Unlit,
                Unknown,
                NotSupported,
            }
            
            public TargetType BiRP;
            public TargetType URP;
            public TargetType HDRP;
        }
        
        class SubTargetData
        {
            [JsonProperty("m_Type")]
            public string type;
        }
        
        public static TargetsInfo GetTargetsFromGraph(string path)
        {
            // adapted from ShaderGraphImporter.cs
            var textGraph = File.ReadAllText(path, Encoding.UTF8);
            // var graph = new GraphData
            // {
            //    messageManager = new MessageManager(),
            //    assetGuid = AssetDatabase.AssetPathToGUID(path)
            // };
            var activeSubTargetTypes = new List<string>();
            
            // Using the SG internal API doesn't help, as it doesn't provide SubTarget info for unknown targets.
            // So we're doing that ourselves here.

            // Individual JSON snippets. We can search in them for targets
            var entries = MultiJsonInternal.Parse(textGraph);
            for (var i = 0; i < entries.Count; i++)
            {
                if (!entries[i].type.EndsWith("SubTarget"))
                    continue;
                
                var targetData = JsonConvert.DeserializeObject<SubTargetData>(entries[i].json);
                activeSubTargetTypes.Add(targetData.type);
                
                // Debug.Log("### Snippet " + i + " : " + entries[i].type + "/n" + entries[i].json);
                // Debug.Log(targetData.type);
            }
            
            // UnityEditor.Rendering.Universal.ShaderGraph.UniversalUnlitSubTarget
            // UnityEditor.Rendering.Universal.ShaderGraph.UniversalLitSubTarget
            // UnityEditor.Rendering.BuiltIn.ShaderGraph.BuiltInLitSubTarget
            // UnityEditor.Rendering.BuiltIn.ShaderGraph.BuiltInUnlitSubTarget

            var urpTargetType = TargetsInfo.TargetType.NotSupported;
            var urpTarget = activeSubTargetTypes.FirstOrDefault(x => x.Contains(".Universal"));
            if (urpTarget != null)
            {
                if (urpTarget.Contains("Unlit")) urpTargetType = TargetsInfo.TargetType.Unlit;
                else if (urpTarget.Contains("Lit")) urpTargetType = TargetsInfo.TargetType.Lit;
                else urpTargetType = TargetsInfo.TargetType.Unknown;
            }
            
            var birpTargetType = TargetsInfo.TargetType.NotSupported;
            var birpTarget = activeSubTargetTypes.FirstOrDefault(x => x.Contains(".BuiltIn"));
            if (birpTarget != null)
            {
                if (birpTarget.Contains("Unlit")) birpTargetType = TargetsInfo.TargetType.Unlit;
                else if (birpTarget.Contains("Lit")) birpTargetType = TargetsInfo.TargetType.Lit;
                else birpTargetType = TargetsInfo.TargetType.Unknown;
            }
            
            var hdrpTargetType = TargetsInfo.TargetType.NotSupported;
            
            return new TargetsInfo
            {
                BiRP = birpTargetType,
                URP = urpTargetType,
                HDRP = hdrpTargetType, // not implemented right now
            };
        }
    }
}