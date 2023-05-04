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
        public override string HelperID => "StencilLayers_" + gameObject.GetInstanceID();

        LayerUtility maskUtility = new LayerUtility();
        public override EditorMaskUtility MaskUtility => maskUtility;

        public override bool IsLayersHelper => false;
    }
}
