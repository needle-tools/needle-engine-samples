using UnityEngine;

namespace Needle
{
    public class StencilLayerHelper : MaskHelper
    {
        MaskEntry[] _masks = new MaskEntry[]
        {
            new MaskEntry { Index = 7, Name = "World_1_Mask" },
            new MaskEntry { Index = 8, Name = "World_1_Content" },
            new MaskEntry { Index = 9, Name = "World_2_Mask" },
            new MaskEntry { Index = 10, Name = "World_2_Content" },
            new MaskEntry { Index = 11, Name = "World_3_Mask" },
            new MaskEntry { Index = 12, Name = "World_3_Content" }
        };

        public override MaskEntry[] Masks => _masks;
        // Unity 6000.4+ EntityId migration: GetInstanceID() is obsolete (compile error in 6000.5).
#if UNITY_6000_4_OR_NEWER
        public override string HelperID => "StencilLayers_" + gameObject.GetEntityId();
#else
        public override string HelperID => "StencilLayers_" + gameObject.GetInstanceID();
#endif

        LayerUtility maskUtility = new LayerUtility();
        public override EditorMaskUtility MaskUtility => maskUtility;

        public override bool IsLayersHelper => false;
    }
}
