using System;
using GLTF.Extensions;
using GLTF.Schema;
using Newtonsoft.Json.Linq;
using UnityGLTF.Plugins;

namespace Needle.Terrain
{
    [Serializable]
    public class Needle_Terrain_Material : IExtension
    {
        public static string EXTENSION_NAME => "NEEDLE_terrain_material";
        public TextureInfo splatMap;
        
        public TextureInfo baseMapR;
        public TextureInfo baseMapG;
        public TextureInfo baseMapB;
        public TextureInfo baseMapA;
        public TextureInfo normalMapR;
        public TextureInfo normalMapG;
        public TextureInfo normalMapB;
        public TextureInfo normalMapA;
        
        
        public JProperty Serialize()
        {
            var jo = new JObject();
            JProperty jProperty = new JProperty(EXTENSION_NAME, jo);
            
            if (splatMap != null)
                jo.WriteTexture(nameof(splatMap), splatMap);
            if (baseMapR != null)
                jo.WriteTexture(nameof(baseMapR), baseMapR);
            if (baseMapG != null)
                jo.WriteTexture(nameof(baseMapG), baseMapG);
            if (baseMapB != null)
                jo.WriteTexture(nameof(baseMapB), baseMapB);
            if (baseMapA != null)
                jo.WriteTexture(nameof(baseMapA), baseMapA);
            if (normalMapR != null)
                jo.WriteTexture(nameof(normalMapR), normalMapR);
            if (normalMapG != null)
                jo.WriteTexture(nameof(normalMapG), normalMapG);
            if (normalMapB != null)
                jo.WriteTexture(nameof(normalMapB), normalMapB);
            if (normalMapA != null)
                jo.WriteTexture(nameof(normalMapA), normalMapA);

            return jProperty;
            
        }

        public IExtension Clone(GLTFRoot root)
        {
            return new Needle_Terrain_Material
            {
                splatMap = splatMap,
                baseMapR = baseMapR,
                baseMapG = baseMapG,
                baseMapB = baseMapB,
                baseMapA = baseMapA,
                normalMapR = normalMapR,
                normalMapG = normalMapG,
                normalMapB = normalMapB,
                normalMapA = normalMapA
            };
        }
    }
}